import { graphql, buildSchema } from "graphql";
import express from 'express'
import { graphqlHTTP } from 'express-graphql'

var schema = buildSchema(`
    type Query {
        quoteOfTheDay: String
        random: Float!
        rollThreeDice: [Int]
        rollDice(numDice: Int!, numSides:Int): [Int]
        getReady: Ready
        getDie(numSides: Int): RandomDie 
    }

    type Ready {
        kelo: String
    }

    type RandomDie {
        numSides: Int!
        rollOnce: Int!
        roll(numRolls: Int!): [Int]
    }
`)

class RandomDie {
    constructor(numSides) {
        this.numSides = numSides
    }

    rollOnce() {
        return 1 + Math.floor(Math.random() * this.numSides)
    }

    roll({ numRolls }) {
        var output = []
        for (var i = 0; i < numRolls; i++) {
            output.push(this.rollOnce())
        }
        return output
    }
}

var root = {
    quoteOfTheDay: () => {
        return Math.random() < 0.5 ? "Take it easy" : "Salvation lies within"
    },
    random: () => {
        return Math.random()
    },
    rollThreeDice: () => {
        return [1, 2, 3].map(_ => 1 + Math.floor(Math.random() * 6))
    },
    getReady: () => {
        return readyResolver
    },
    rollDice: ({ numDice, numSides }) => {
        var output = []
        for (var i = 0; i < numDice; i++) {
            output.push(1 + Math.floor(Math.random() * (numSides || 6)))
        }
        return output
    },
    getDie: ({ numSides }) => {
        return new RandomDie(numSides || 6)
    }
}

var readyResolver = {
    kelo: () => {
        return "Ke pasa"
    }
}

var app = express()

app.use(
    "/graphql",
    graphqlHTTP({
        schema: schema,
        rootValue: root,
        graphiql: true
    })
)

app.listen(4000)
console.log('Running a GraphQL API server at http://localhost:4000/graphql')