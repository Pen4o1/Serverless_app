const { app } = require('@azure/functions')
const sql = require('mssql')
const {config} = require('../database/config.js')

async function streamToString(readableStream) {
    const chunks = []
    for await (const chunk of readableStream) 
        chunks.push(chunk)

    return Buffer.concat(chunks).toString('utf-8')
}

app.http('MakeReview', {
    methods: ['POST'], 
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Processing request to create a new review...`)

        try {
            const requestBody = await streamToString(request.body)
            const reviewData = JSON.parse(requestBody)

            if (!reviewData)
                return { status: 400, body: "Request body is required." }

            const { movie_id, review, rating, date, author } = reviewData
            if (!movie_id || !review || !rating || !date || !author)
                return { status: 400, body: "Please provide all required fields: movie_id, review, rating, date, author." }

            await sql.connect(config)
            
            const sqlRequest = new sql.Request()
            sqlRequest.input('movie_id', sql.Int, movie_id)
            sqlRequest.input('review', sql.Text, review)
            sqlRequest.input('rating', sql.Float, rating)
            sqlRequest.input('date', sql.DateTime, date)
            sqlRequest.input('author', sql.VarChar(255), author)
            await sqlRequest.query('INSERT INTO Ratings (movie_id, review, rating, date, author) VALUES (@movie_id, @review, @rating, @date, @author)')
            
            await sql.close()
            return { status: 201, body: "Review record created successfully." }
        } catch (error) {
            console.log('Error creating review record:', error)
            return { status: 500, body: `Error creating review record: ${error.message}` }
        }
    }
})
