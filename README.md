# I Dig Doge

## Getting Started

### First Run

- Copy `config.default.js` to `config.js`, and fill it out with the appropriate details.
- Install the dependencies using `npm install`.
- In order to compile the SASS file, you need to install `ruby` and the `sass gem`. Something like `sudo apt-get install ruby` and `sudo gem install sass`.
- Install `grunt-cli` globally using `npm install grunt-cli --global`. You may need to `sudo` that.
- Build all the client-side JS and CSS files using `grunt`.
- (Optional) Build the scrypt module by changing into the `scrypt` directory and running `make node`.

### Running

I've gotten a few questions about running the application. So here's some snippets that will hopefully help people get started.

- First of all, there's `node server.js`. It's your basic run command.
- If you want to log the output to a file, you can add `>> /tmp/file.log`.
- Putting `&` at the end of the command runs it in the background, so it won't be killed when you close your terminal window or SSH connection.
- If you want to pass in options to the application, you put them at the beginning in the form of `NODE_PORT=9870`.

When you put them all together, you get what I use in my start script:

`NODE_PORT=9870 NODE_ENV=production node server.js >> /tmp/server.log &`

#### server.js

##### Options

- `NODE_ENV` modifies settings specified in [Environments](#environments).
- `NODE_PORT` or `PORT` controls the port for HTTP requests. It will overwrite the setting in `config.js`. HTTPS is not yet supported.

#### payer.js

##### Options

- `NODE_CLEANUP` is the number of milliseconds between cleanup actions, which removes old shares from the database and performs the [BGREWRITEAOF](http://redis.io/commands/bgrewriteaof) command.

### Environments

Express checks the `NODE_ENV` environment variable to know what features to turn on. I've configured two:

- `development` serves files from the `public` directory. Logs requests to the console.
- `production` does not serve files. Turns on `trust proxy`. Turns on `view cache`. Does not log requests. I run it behind NGINX, which I have set up to serve the files from the `public` directory and log everything.

## Paying Out

This is a manual process right now, for a lot of reasons. You're welcome to automate it if you see fit though. Here's the basics of how it works. All of this goes on in the `processing` directory.

- Connect to the redis database using `redis-cli`.
- Run `LRANGE withdraw 0 -1`. You'll get something like this:

```
1) "{\"email\":\"hello@example.com\",\"amount\":\"1\",\"address\":\"DM7BaRfSxUhvz8eJ9dHeChzEifJaP5poFL\"}"
2) "{\"email\":\"blank@example.com\",\"amount\":\"1\",\"address\":\"DM7BaRfSxUhvz8eJ9dHeChzEifJaP5poFL\"}"
```

- Copy the results into the `data.txt` file, and remove the line numbers and junk from the front. Like so:

```
"{\"email\":\"hello@example.com\",\"amount\":\"1\",\"address\":\"DM7BaRfSxUhvz8eJ9dHeChzEifJaP5poFL\"}"
"{\"email\":\"blank@example.com\",\"amount\":\"1\",\"address\":\"DM7BaRfSxUhvz8eJ9dHeChzEifJaP5poFL\"}"
```

- Run the `generate.js` file. This will put the proper information into the `output.json` file, which will look like this since the above addresses are the same:

```
{
	"DM7BaRfSxUhvz8eJ9dHeChzEifJaP5poFL": 2.00000001
}
```

- The `payout.js` file has the line that actually makes the transaction commented out by default. I run it once to make sure the balance will cover the transaction. If it will, I uncomment it, and run it again. When the transaction is made, the transaction ID will be logged. Or an error, depending on what actually happened.
- To get rid of the processed transactions, run the command `LTRIM withdraw # -1`, replacing the number sign with the number of records processed. In the above example, it would be `2`. This makes sure you don't remove any withdrawal requests that were made since the `LRANGE` command, because that would be bad.

## Changes You Might Care About

### Version 2.0.2

- Use `PORT` or `NODE_PORT` environment variables.
- The default config file is now separate.
- There's options for which scrypt implementation you use.

### Version 2.0.1

- Minor changes for HTTPS.
- Uses another scrypt implementation on the server for easier install.
- Checks Dogecoin addresses properly, by decoding and validating the checksum.

### Version 2.0.0

- Brand new look.
- Using Grunt for minifying and combining front-end files.
- All the scrypt implementations use the same C++ code base.
- In Chrome, we now use [PNACL](https://developers.google.com/native-client/dev/) instead of JavaScript.
- Switched to SASS for CSS.
- The giant JS file has been split up into manageable chunks.
