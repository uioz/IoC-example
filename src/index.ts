import { Container } from "inversify";
import { TYPES } from "./types";
import { Warrior, Weapon, ThrowableWeapon } from "./interfaces";
import { Ninja, Katana, Shuriken } from "./entities";
import { equal } from "assert";

const myContainer = new Container({
  autoBindInjectable:true,
  defaultScope:'Singleton'
});

const ninja = myContainer.get(Ninja);


equal(ninja.fight(), 'cut')
equal(ninja.sneak(), 'hit!')
