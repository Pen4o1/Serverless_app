const { app } = require('@azure/functions');
const sql = require('mssql');
const {config} = require('../database/config.js');

app.timer('AVGrating', {
    schedule: '0 30 11 * * *', 
    handler: async (myTimer, context) => {
        try {
            context.log('Timer trigger function ran!', new Date().toISOString());
            await sql.connect(config);

            await sql.query(`
                UPDATE dbo.Movie 
                    SET average_rating = (
                    SELECT AVG(CAST(rating as FLOAT)) 
                    FROM dbo.Ratings 
                    WHERE Movie.id = Ratings.movie_id
                    )
            `);
            await sql.close();

            context.log('Average ratings calculated and updated successfully.');
        } catch (error) {
            context.log.error('Error in timer trigger function:', error);
        }
    }
});