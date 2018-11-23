const certdir = '/etc/letsencrypt/live';
const fs = require('fs');


let files = {};

fs.readdirSync(certdir).forEach(dir => {
          if (fs.lstatSync(certdir+"/"+dir).isDirectory()) {
                const tlscrt = dir+".crt";
                const tlskey= dir+".key";
                const tlscrt_data = fs.readFileSync(certdir+"/"+dir+"/fullchain.pem");
                const tlskey_data = fs.readFileSync(certdir+"/"+dir+"/privkey.pem");

                files[tlscrt]=tlscrt_data.toString('base64');
                files[tlskey]=tlskey_data.toString('base64');
          }
})

//console.log(files);


const update = {
    "kind":"Secret",
    "apiVersion":"v1",
    "metadata": {
            "name":"letsencrypt-certs",
            "namespace":"default",
    },
    "type":"Opaque",
    "data": files
};

console.log(JSON.stringify(update));
