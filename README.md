# I Dig Doge

## License & Thanks

So I don't know how to license stuff. I just start reading the legalese and my brain shuts down. Either way, I want to thank this guy for his work, which provided a huge speed boost on the client side. I think I've included the appropriate notices in the `scrypt/license.txt` file.

https://github.com/tonyg/js-scrypt

## Dependencies

There's a few packages from NPM that you'll need.

### Development

- `uglify-js` for minifying JS
- `sqwish` for minifying CSS

### Development & Production

These are also in the `package.json` file, so you can just run `npm install` in the proper directory and it will get these for you.

- `express`
- `jade`
- `nodemailer`
- `redis`
- `hiredis`

## Some Important Files

- `compile.sh` is a super simple script that minifies and concatenates files for the front end.
- `config.js` contains the configuration for everything. Bet you didn't see that coming.
- `payer.js` is a run file. It checks the database for submitted shares, and updates the submitter's balance if the share is valid.
- `processing/` is the directory that contains the code that actually connects to the Dogecoin RPC-API and processes withdrawal requests. It's a manual process though, which I've detailed below.
- `server.js` is a run file. It's where the bulk of the work happens. It serves API requests, connects to the parent pool, and pretty much everything else. It also serves as a handy list of endpoints for everything.

## Getting Started

- Fill out the `config.js` file.
- Start up the server using something like `node server.js`.
- Start up the processor using something like `node payer.js`.

### Environments

Express checks the `NODE_ENV` environment variable to know what features to turn on. I've configured three:

- `development` serves unminified files from the `raw` directory. Logs requests to the console.
- `testing` serves minified files from the `public` directory. Logs requests to the console.
- `production` does not serve files. Turns on `trust proxy`. Does not log requests. I run it behind NGINX, which I have set up to serve the files from the `public` directory and log everything.

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
