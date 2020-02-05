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

  private katana: Katana;
  private shuriken: Shuriken;

  public constructor(katana: Katana, shuriken: Shuriken) {
      this.katana = katana;
      this.shuriken = shuriken;
  }
  // constructor(
  //   @inject(TYPES.Weapon) private katana: Weapon,
  //   @inject(TYPES.ThrowableWeapon) private shuriken: ThrowableWeapon
  // ) {
  // }

  fight() {
    return this.katana.hit();
  }

  sneak() {
    return this.shuriken.throw();
  }
}

export { Ninja, Katana, Shuriken };