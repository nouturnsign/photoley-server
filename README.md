# Photoley Server

Server for Photoley app.

## Documentation

See [`docs/index.html`](docs/index.html).

## Deployment

Currently using Render.

Hosted at https://photoley-server.onrender.com

Visiting the base URL gives a basic health check.

## Local Development

### Installation

To install, first make sure the following are installed:

- [nvm](https://github.com/nvm-sh/nvm)
- [npm](https://www.npmjs.com/)

Then, to clone the project and install its dependencies,

```sh
nvm use
npm install
```

### Running Locally

> :warning: **This assumes you have access to necessary secret files.**

```sh
npm run dev
```

### Building Documentation

To lint documentation,

```sh
npx @redocly/cli lint private@v1
```

To build documentation,

```sh
npx @redocly/cli build-docs private@v1
```

For convenience, the following script is provided to both lint and build docs, output to `docs/index.html`.

```sh
npm run build-docs
```

### Collaboration

Please do not directly push to main. Instead, create a branch, and open a pull request.
