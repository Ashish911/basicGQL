import { graphql, buildSchema } from "graphql";
import express from 'express'
import { graphqlHTTP } from 'express-graphql'
import crypto from 'crypto'

var schema = buildSchema(`
    input MessageInput {
        content: String
        author: String
    }

    type Message {
        id: ID!
        content: String
        author: String
    }

    type Ready {
        kelo: String
    }

    type RandomDie {
        numSides: Int!
        rollOnce: Int!
        roll(numRolls: Int!): [Int]
    }

    type User {
        id: String
        name: String
    }

    type Query {
        quoteOfTheDay: String
        random: Float!
        rollThreeDice: [Int]
        rollDice(numDice: Int!, numSides:Int): [Int]
        getReady: Ready
        getDie(numSides: Int): RandomDie 
        getMessage(id: ID!): Message
        getAllMessage: Message
        user(id: String): User
    }

    type Mutation {
        createMessage(input: MessageInput): Message
        updateMessage(id: ID!, input: MessageInput): Message
    }

`)

class Message {
    constructor(id, { content, author }) {
        this.id = id
        this.content = content
        this.author = author
    }
}

var fakeDatabase = {}

var fakeUserDatabase = {
    a: {
        id: "a",
        name: "alice"
    },
    b: {
        id: "b",
        name: "bob"
    }
}

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
    },
    getMessage: ({ id }) => {
        if (!fakeDatabase[id]) {
            throw new Error("No message exists with id " + id)
        }
        return new Message(id, fakeDatabase[id])
    },
    getAllMessage: () => {
        return fakeDatabase
    },
    createMessage: ({ input }) => {
        var id = crypto.randomBytes(10).toString('hex')

        fakeDatabase[id] = input
        return new Message(id, input)
    },
    updateMessage: ({ id, input }) => {
        if (!fakeDatabase[id]) {
            throw new Error("No message exists with id " + id)
        }

        fakeDatabase[id] = input
        return new Message(id, input)
    },
    user: ({ id }) => {
        return fakeUserDatabase[id]
    }
}

var readyResolver = {
    kelo: () => {
        return "Ke pasa"
    }
}

const logginMiddleware = (req, res, next) => {
    console.log("ip:", req.ip)
    next()
}

var app = express()

app.use(logginMiddleware)
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