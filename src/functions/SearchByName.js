const { app } = require('@azure/functions');
const sql = require('mssql');
const { config } = require('../database/config.js');

app.http('SearchByName', {
    methods: ['GET'],
    route: 'SearchByName/{title?}',
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Processing search request...`);

        try {
            const title = request.params.title;

            let moviesQuery = 'SELECT * FROM Movie';
            let reviewsQuery = 'SELECT Movie.name, Ratings.rating, Ratings.review FROM Movie LEFT JOIN Ratings ON Movie.id = Ratings.movie_id WHERE';
            if (title) {
                moviesQuery += ` WHERE name LIKE '${title}'`;
                reviewsQuery += ` Movie.name = '${title}' AND`;
            }
            reviewsQuery += ' (Ratings.review IS NOT NULL OR Ratings.rating IS NOT NULL)';

            await sql.connect(config);

            const movies = await sql.query(moviesQuery);
            const reviews = await sql.query(reviewsQuery);

            await sql.close();

            return {
                status: 200,
                body: `
Movies:
${movies.recordset.map(movie => `- ${movie.name} (${movie.year}): ${movie.descript}`).join('\n')}
                    \nReviews:
                    ${reviews.recordset.map(review => `- ${review.name}: Rating ${review.rating}, Review: ${review.review}`).join('\n')}
                    `
            };
        } catch (error) {
            console.error('Error searching for movie:', error.message);
            return { status: 500, body: `Error processing search request: ${error.message}` };
        }
    }
});
