# Run development code on database
# Author : DHU
# Date : 2017-03

env=$1

Run () {
   echo "Running app on: $2" 
   MONGO_URL=mongodb://cartonplein:papiervide@$1/$2 meteor run -p 8080
}

case $env in
    "DEV")
    Run "ds135830.mlab.com:35830" "cartonplein_dev"
    ;;
    "STAG") 
    echo "STAG"
    Run "ds137530.mlab.com:37530" "cartonplein_stag"
    ;;
    "PROD") 
    Run "ds137540.mlab.com:37540" "cartonplein_prod"
    ;;
esac

