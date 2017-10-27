if(process.env.NODE_ENV =='production'){
  module.exports = {mongoURI : 'mongodb://rishabh:ilovemyindia1234>@ds237445.mlab.com:37445/test-prod'}
}
else{
  module.exports = {mongoURI: 'mongodb://localhost/vidjot-dev'}
}