import { Container } from "inversify";
import { TYPES } from "./types";
import { Warrior, Weapon, ThrowableWeapon } from "./interfaces";
import { Ninja, Katana, Shuriken } from "./entities";
import { equal } from "assert";

const myContainer = new Container();
myContainer.bind<Warrior>(TYPES.Warrior).to(Ninja);
myContainer.bind<Weapon>(TYPES.Weapon).to(Katana);
myContainer.bind<ThrowableWeapon>(TYPES.ThrowableWeapon).to(Shuriken);

const ninja = myContainer.get<Warrior>(TYPES.Warrior);

console.log(equal(ninja.fight(), 'cut'),'ok');
console.log(equal(ninja.sneak(), 'hit!'),'ok');
