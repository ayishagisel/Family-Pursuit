#!/bin/bash

# Script to run Jest tests for the Family App

# Set NODE_ENV to test
export NODE_ENV=test

# Run Jest with the specified configuration
case "$1" in
  "watch")
    npx jest --config jest.config.js --watch
    ;;
  "coverage")
    npx jest --config jest.config.js --coverage
    ;;
  *)
    npx jest --config jest.config.js
    ;;
esac