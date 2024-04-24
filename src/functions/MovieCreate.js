const { app } = require('@azure/functions')
const sql = require('mssql')
const {config} = require('../database/config.js')

async function streamToString(readableStream) {
    const chunks = []
    for await (const chunk of readableStream) 
        chunks.push(chunk)

    return Buffer.concat(chunks).toString('utf-8')
}

app.http('MovieCreate', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        console.log(`Processing request to create a new movie...`)

        try {
            const requestBody = await streamToString(request.body)
            const movieData = JSON.parse(requestBody)
            console.log(requestBody)

            if (!movieData)
                return { status: 400, body: "Request body is required." }

            const {name, year, genre, descript, producer, actors } = movieData
            if (!name || !year || !genre || !descript || !producer || !actors)
                return { status: 400, body: "Please provide all required fields: title, year, genre, description, director, actors." }

            await sql.connect(config)
            
        let sqlRequest = new sql.Request()
        sqlRequest.input('name', sql.VarChar(100), name)
        sqlRequest.input('year', sql.Int, year)
        sqlRequest.input('genre', sql.VarChar(50), genre)
        sqlRequest.input('descript', sql.Text, descript)
        sqlRequest.input('producer', sql.VarChar(50), producer)
        sqlRequest.input('actors', sql.Text, actors)
        sqlRequest.input('average_rating', sql.Float, 1)
        await sqlRequest.query('INSERT INTO Movie (name, year, genre, descript, producer, actors, average_rating) VALUES (@name, @year, @genre, @descript, @producer, @actors, @average_rating)')

            await sql.close()
            return { status: 201, body: "Movie record created successfully." }
        } catch (error) {
            console.log('Error creating movie record:', error)
            return { status: 500, body: `Error creating movie record: ${error.message}` }
        }
    }
})
