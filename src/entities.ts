import "reflect-metadata";
import { injectable, inject } from "inversify";
import { ThrowableWeapon, Weapon, Warrior } from "./interfaces";
import { TYPES } from "./types";


@injectable()
class Katana implements Weapon {
  hit() {
    return "cut"
  }
}

@injectable()
class Shuriken implements ThrowableWeapon {
  public throw() {
    return "hit!";
  }
}

@injectable()
class Ninja implements Warrior {

  private _katana: Weapon;
  private _shuriken: ThrowableWeapon;

  constructor(
    @inject(TYPES.Weapon) katana: Weapon,
    @inject(TYPES.ThrowableWeapon) shuriken: ThrowableWeapon
  ) {
    this._katana = katana;
    this._shuriken = shuriken;
  }

  fight() {
    return this._katana.hit();
  }

  sneak() {
    return this._shuriken.throw();
  }
}

console.dir(Ninja)

export { Ninja, Katana, Shuriken };