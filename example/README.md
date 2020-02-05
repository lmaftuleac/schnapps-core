# ChainController example
How to use chainable controller and branches

1. Run `npm install` then start the project `npm start`

2. Acces `localhost:8080/?branch=<value>&throwMessage=<value>`

3. Combine parameters, ex: leave only `/?throwMessage=<value>` will result an error returned by main controller
    * `/?branch=first&throwMessage=<value>` will result first branch throwing an error
    * `/?branch=first` will result first branch returning a greet messge