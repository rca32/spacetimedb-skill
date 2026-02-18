#!/bin/bash

read -p "Enter the spacetime server name (e.g. bitcraft-staging): " host

for i in {1..9}; do
  spacetime call -s "$host" "bitcraft-$i" #add reducer here
done
