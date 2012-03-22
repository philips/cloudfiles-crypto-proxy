# Cloudfiles Crypto Proxy

`cloudfiles-crypto-proxy` is an HTTP proxy between your client and Rackspace
Cloudfiles that encrypts the object as it is uploaded with an AES key.

# Usage

Startup the proxy on port 3000 using an example key

    cloudfiles-crypto-proxy.js -c config-example.json -p 3000

Upload a file using `node-cloudfiles` proxied through http://localhost:3000

    cloudfiles-upload-test.js -f README.md -u <user> -k <apikey> -p 'http://127.0.0.1:3000'

# Video

Funny video of the first demo of this proxy:

http://www.youtube.com/watch?v=UE1Wg-BoWoM
