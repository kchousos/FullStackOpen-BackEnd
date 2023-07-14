require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

const app = express()

app.use(express.json())
morgan.token('body', req => JSON.stringify(req.body))
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))
app.use(cors())
app.use(express.static('dist'))

/// START OF FUNCTIONS ///

app.get('/api/persons', (request, response) => {
  Person.find({}).then(persons => {
    response.json(persons)
  })
})

app.get('/info', (request, response) => {
  Person.find({}).then(persons => {
    response.send(`\
    <p>Phonebook has info for ${persons.length} people</p>\
    <p>${new Date()}</p>`)
  })
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => response.json(person))
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then(() => response.status(204).end())
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const { name, number } = request.body

  const person = { name, number }

  Person.findByIdAndUpdate(
    request.params.id,
    person,
    { new: true, runValidators: true, context: 'query' },
  )
    .then(updatedPerson => {
      response.json(updatedPerson)
    })
    .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
  const { name, number } = request.body

  if (!name) {
    return response.status(400).json({
      error: 'name is missing',
    })
  }

  if (!number) {
    return response.status(400).json({
      error: 'number is missing',
    })
  }

  const person = new Person({ name, number })

  person.save()
    .then(savedPerson => {
      response.json(savedPerson)
    })
    .catch(error => next(error))
})

/// ERROR HANDLING ///

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

// handler of requests with unknown endpoint
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  }
  if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }
  if (error.name === 'ValidatorError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

// handler of requests with result to errors
app.use(errorHandler)

// LISTEN LOOP

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
