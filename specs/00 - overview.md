# Overview

Showroom is a frontend for Garage, an S3 compatible storage service.

This web app allows user to control their storage with a clean and simple UI.

The wep app has a modern and minimal style, in a orange palette.

## Structure of the app
The initial page welcomes the user showing some widgets:

1. the health status of the cluster 
2. a list of the available buckets, limited at 10 units.

On the left, there's a menu that allows to reach the following pages:
1. Buckets, see [the relevant page](./02%20-%20buckets.md)
2. Keys, see [the relevant page](./01%20-%20keys.md)

## API
Garage offers API endpoints, request must have an `Authorization` header, using `Bearer AUTH_TOKEN`. AUTH_TOKEN is fetched from env vars. BASE_URL is fetched from vars.

See the API documentation at https://garagehq.deuxfleurs.fr/api/garage-admin-v1.html
