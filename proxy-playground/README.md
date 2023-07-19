# Minimal Hardhat Repo Boilerplate

**Motivation**

I wanted to setup a hard hat repo from scratch without any guides to truly understand why I need each of the plugins I've installed.

I've also taken the opportunity to structure the project how I see best.

And I intend to breakdown the depencies below.

## Getting started

I will write this eventually. But not right now.

## Dependencies breakdown

1. typescript + ts-node (+ @types/\*)

I refuse to develop in plain JS in 2023. These are mandatory and for the most part, handled by hardhat.

1. @typechain/hardhat

This package will generate typescript types whenever you compile your contracts allowing you to have typesafety. Think of it as the blockchain version of `prisma`.

1. hardhat

If you are working with hardhat, you need it installed... not that complicated

1. ethers

Ethers is a leading library used to interact with various blockchains. It is compatible with both the backend(node.js/typescript) and the frontend(browser).

1. @nomicfoundation/hardhat-ethers

Hardhat provides a helper library to extend the base functionality of ethers, allowing for a more rapid and comprehensive development environment.

1. @nomicfoundation/hardhat-verify

This package allows you to verify deployed contract on Etherscan programatically. Basically your contract will _always_ be confirmed on Etherscan. (Nice!)

1. hardhat-deploy & hardhat-deploy-ethers

Hardhat deploy is responsible for the `hardhat deploy` command which will run all the scripts in your deploy folder.

`hardhat-deploy` offers the ability to tag individual files, so that you have more control over what you deploy with the `--fixture` flag.

`hardhat-deploy-ethers` adds additional functionality to `import { ethers } from 'hardat'`

I have primarily used the `ethers.getContract` function offered by the package, as I gain a deeper understanding of the package, I will likely add to this section.

1. dotenv

Dotenv is a standard library people use to import environment variables from a local `.env` file.

WARNING: BE SURE TO NEVER COMMIT YOUR `.env` FILE INTO YOUR GIT REPO

1. chai + @nomicfoundation/hardhat-chai-matchers

Chai is a assertation library used to write more human readable `expect` statements. Chai is used in tandem with Mocha, which is a testing framework, which is run by Hardhat under the hood.

Basically:

- Chai -> `expect(<variable>).to.be.eq(1)`
- Mocha -> `describe(...)` & `it(...)`

@nomicfoundation/hardhat-chai-matchers extends the base of Chai to add blockchain specific "results"

So you can do things like `await expect(contract.contractFunction).to.be.reverted`

1. hardhat-gas-reporter

Hardhat gas reporter will output how much your gas your functions are consuming allowing you to identify the problematic functions in your code and where to focus your gas optimization efforts.

1. solidity-coverage

solidity-coverage will report how much of your smart contracts have been tested.

This is by no means a bullet proof solution, as you can still have 100% test coverage, and all tests passing and still deploy bugs.

1. zod

This is a personal choice and can easliy be removed, however I love this library to write nice and concise validators that can be used in a variety of ways.
