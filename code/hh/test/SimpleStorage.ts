import { expect } from "chai";
import { ethers } from "hardhat";
import { SimpleStorage } from "../typechain-types";

describe("SimpleStorage", function () {
  let ss: SimpleStorage;
  this.beforeEach(async function () {
    const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
    ss = await SimpleStorage.deploy();
    await ss.waitForDeployment();
  });

  it("Should default to 0", async function () {
    const expectedValue = "0";
    expect((await ss.retreive()).toString()).to.equal(expectedValue);
  });

  it("Should store the value 42", async function () {
    const expectedValue = "42";
    await ss.store(expectedValue);
    expect((await ss.retreive()).toString()).to.equal(expectedValue);
  });

  it("person nathan should have 1337 as default value", async function () {
    const expectedValue = "0";
    expect((await ss.getPersonsFavoriteNumber("Nathan")).toString()).to.equal(expectedValue);
  });

  it("person nathan should have 42 as favorite number", async function () {
    const expectedValue = "42";
    await ss.addPerson("Nathan", expectedValue);
    expect((await ss.getPersonsFavoriteNumber("Nathan")).toString()).to.equal(expectedValue);
  });
});
