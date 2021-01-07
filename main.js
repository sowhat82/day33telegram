const {Telegraf} = require ('telegraf')
const express = require('express')
const secureEnv = require('secure-env')
global.env = secureEnv({secret:'mySecretPassword'})
const fs = require ('fs/promises')
const withquery = require('with-query').default
const fetch = require('node-fetch')
const {MenuTemplate, MenuMiddleware} = require('telegraf-inline-menu')

//create a bot
const bot = new Telegraf(global.env.TELEGRAM_TOKEN)
const app = express()
const photoURL = ""
const newsapiurl = 'http://newsapi.org/v2/top-headlines'
const apikey = global.env.NEWS_API_KEY

const fetchNews = async (country, ctx) => {

    ctx.reply(`Retrieving top 3 news articles from ${country}`)

    //construct the url with the query parameters
    const url = withquery(
        newsapiurl,
        {
            country: country,
            pageSize: 3
        }
    )
    //fetch returns a promise, to be opened using await. within it is an object with a json function. 
    const result = await fetch(url, {headers:{'X-Api-Key': apikey}}) 
    //result.json returns yet another promise, containing the final json object to be examined.
    const newsapiresult =  await result.json() 

    // the below works to move certain elements from an array to a new array
    const results = newsapiresult.articles.map(              //length of new array will be the same
                (d)=> {
                    return {title: d.title, url: d.url, img: d.urlToImage, summary: d.description, publishedat: d.publishedAt}          
                }
    )

    // // formatting of the publishedAt field
    // for(var i=0; i < results.length; i++) {
    //     results[i].publishedat = results[i].publishedat.replace('T', ' ');
    //     results[i].publishedat = results[i].publishedat.replace('Z', ' ');
    // }

    // console.info(results)

    for(var i=0; i < results.length; i++) {
        ctx.reply(results[i].title + '\n\n' + results[i].summary + '\n\n' + results[i].url)
    }
}

// when a user starts a session with the bot
bot.start(ctx => {

    // 2 ways to display a welcome picture, either by URL, or by a local file

    // ctx.replyWithPhoto(photoURL, {caption: 'Hello!!!'})

    // fs.readFile(__dirname + '/images/img-file.jpg').then((buffer) => {
    //     ctx.replyWithPhoto({ source: buffer });
    //   });

    ctx.reply('Welcome to News Bot')
})

bot.hears('hi', ctx => ctx.reply ('hi there2!'))

bot.command('news', async ctx => {
    
    const country = ctx.message.text.substring(6)

    // display the menu if no country is specified with the command
    if (country.length<=0){
        return menuMiddleware.replyToContext(ctx)
    }


    fetchNews(country, ctx)

})

// create a menu
const menuTemplate = new MenuTemplate(ctx => `Hey ${ctx.from.first_name}! Select a country to continue...`)

menuTemplate.interact('SG', 'sg', {
    do: async ctx => ctx.answerCbQuery('SG').then(() => true)
  })
menuTemplate.interact('US', 'us', {
    do: async ctx => ctx.answerCbQuery('US').then(() => true),
    joinLastRow: true
  })
menuTemplate.interact('KR', 'kr', {
    do: async ctx => ctx.answerCbQuery('KR').then(() => true),
  })

const menuMiddleware = new MenuMiddleware('/', menuTemplate)

bot.use((ctx, next) => {
    if (ctx.callbackQuery != null) {
        const country = ctx.callbackQuery.data.substring(1)
        return fetchNews(country, ctx)
    }
    next()
})

// start the bot
bot.launch()

app.listen(process.env.PORT || 3000);