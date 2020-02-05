# InversifyJS

InversifyJS 作为一个 DI 的实现, 结合了相当多的 JavaScript 的新特性, 有些特性甚至还在 JavaScript Stage 2 的阶段中, 只有完全使用 TypeScript 才可以使用 InversifyJS 的完整功能.  
当然在 JavaScript 环境下也可以有运行的手段, 这样做需要编写一些额外的辅助代码, 总的来讲 TypeScript 是编写 InversifyJS 的愉快选择, 本文后面的代码都基于 TypeScript 特性火力全开的情况下, 不考虑非 TypeScript 的情况.

InversifyJS 依赖了相当多的注解, 并且依赖 reflect-metadata 这个第三方库垫片库来完成有关 "元数据" 的功能(这是一个 JavaScript 的新特性提案但还不是标准通过这个垫片库可以实现提案中的功能). 依赖了这么多的新特性, 是为了减少使用者的苦恼, 所以 InversifyJS 在使用的时候还是比较轻松的.  

# 基本概念

和其他的相似功能的库一样, InversifyJS 的使用步骤也分为以下三步:
1. 定义一个模块(通常是 Class)
2. 创建一个容器, 将模块和容器进行关联
3. 通过容器去使用这个模块(这个环节通常被称为解析)

后文按照这三个功能点来说明.  

## 模块

InversifyJS 提供了注解 injectable 来表示该注解修饰的类是 "可注入的", 例如下面的这个类:
```typescript
@injectable()
class A {}
```
通过添加这个注解可以允许这个类放入到容器中(涉及到容器的概念, 不了解的可以无视这句话).

一个模块可以依赖另外一个模块, 这些依赖一般在构造的时候通过构造函数注入(有其他方式但是这里不考虑), InversifyJS 提供了 inject 注解标志修饰的内容是要被注入的:
```typescript
// 这里提供了 B 和 C 两个 Symbol
// 由于 Symbol 具有唯一的特性可以用于作为唯一标识符
// 表示类的唯一 Id , B 表示的是类 B 的唯一标识, C 表示的是类 C 的唯一标识
// 在其他位置我们会将这个标识符与类 B 和类C 进行关联, 这里只要视为它们已经关联就好了
// 标识符可以让 InversifyJS 去查找依赖的内容, 除了 Symbol 还可以使用字符串来代替
// 但是 ES6 中的 Symbol 不会重复, 在大型项目中使用字符串可能导致命名冲突
const types = {
  B:Symbol.for('B'),
  C:Symbol.for('C')
}

@injectable()
class A {
  private objB:B;
  private objC:C;
  constructor(
    @inject(types.B) objB:B,
    @inject(types.C) objC:C
  ){
    this.objB = objB;
    this.objC = objC;
  }
}
```
当我们要在容器中使用这个 `class A` 的时候, 我们会使用这个类生产的实例, 而容器会帮我们创建实例. 由于我们标注了 `class A` 在构造函数中需要注入哪些内容, 所以在 `InversifyJS` 在执行前就已经通过注解提供了的信息确认这个类的依赖了, 所以会先解析依赖在创建实例的过程中通过构造函数注入依赖最后返回这个实例.(涉及到容器的部分内容, 不了解的可以无视这句话).

在开启 InversifyJS 需要的新特性下, 如果我们通过构造函数来完成注入, 那么我们可以省略 inject 注解, 则构造函数依赖的所有参数都是依赖:
```typescript
class A {
  private objB:B;
  private objC:C;
  constructor(objB:B,objC:C){
    this.objB = objB;
    this.objC = objC;
  }
}
```
InversifyJS 可以通过 typescript 构造器中的类型声明知道所依赖的内容是谁, 当然如果参数的类型不明确, 例如依赖的是一个数值, 此时你还需要 inject 注解来完成这项任务.

## 容器

### 创建

```typescript
const container = new Container();
```

容器构建选项很少且非常容易理解, 下列给出的都是选项默认值:
```typescript
const myContainer = new Container({
  // 自动注入提供了 @injectable 注解的模块
  autoBindInjectable:false,
  // 该容器下的模块的生命周期
  // 默认是 Transient 即每次被依赖都会被解析一次
  // 可以设置为 Singleton 即只要容器不销毁一旦被解析则永久被缓存
  // 如果模块提供了更加精确的生命周期则容器的会被忽略
  defaultScope:'Transient',
  // 跳过使用了 @injectable 类的基类检查
  // 个人猜测: 如果你的类继承了第三方类, 使用 @injectable 但是你无法让基类使用 @injectable 会产生错误, 这个选项改为 true 可以避免这种问题
  skipBaseClassChecks:false
});

// 另外你还可以在绑定模块的时候指定该模块的生命周期
// 顺便说一句 bind 语法
// container.bind<泛型[用于限制 to]>(类型[就是模块对应的标识符]).to(要绑定的模块本身)
container.bind<Warrior>(TYPES.Warrior).to(Ninja).inSingletonScope();
container.bind<Warrior>(TYPES.Warrior).to(Ninja).inTransientScope();
```

## 绑定

容器可以与模块建立关联, 在 InversifyJS 中这个环节叫做 `binding`(绑定), 所以后文使用绑定在称呼这个过程.  
总的来讲你需要一个模块, 和一个容器, 这两个内容我们已经提到过了, 需要注意的是模块并不已经必须是类, 可以是 JavaScript 中的任何合法的内容, 只不过最常用的是类, 所以下面我们只讨论类的情况, 其他的情况可以看官方文档.  

给定一个类我们来绑定到容器中, 绑定的语法非为两个步骤:
1. 指定类型
2. 指定类型对应的值
```typescript
const container = new Container();

interface Ia {

}

@injectable()
class A implements Ia {

}

container.bind<Ia>('a').to(A);
``` 
在这个例子中 `bind<Ia>` 是泛型限制我们在 `to(A)` 中只能填写符合泛型约束的类. 其次 `bind<Ia>('a')` 中的 `a` 是一个标识符我这里用的是字符串, 在之前的例子中用的是 `Symbol`, 这句话的完整的意思是将标识符 `a` 与 `class A` 建立了关联.  

这个标识符有什么用呢? 当我们获取在容器中的内容的时候我们通过 "标识符" 来获取内容:
```typescript
container.get('a') instanceof A // true
```

这个环节可以简化, 在启用了 typescript 的 `emitDecoratorMetadata` 特性以及引入了 `reflect-metadata` 的情况下你可以使用类本身作为类型:  
```typescript
container.bind<Ia>(A).toSelf();
```

因为 `toSelf` 不需要传入参数你还可以省略泛型:
```typescript
container.bind(A).toSelf();
```

## 作用域

InversifyJS 中有一个重要的概念就是 scope(作用域), 实际上我个人更改称为生命周期. 这个概念用于控制一个模块被实例化后的生存时间. 另外这个概念也不是 InversifyJS 独有的其他相似类库中也有相同的概念.  

我们可以通过 `get` 来获取一个已经注册的模块, 同时也知道一个模块可以依赖另外一个模块:
```typescript
container.get(A)
```

如果我们有 3 个模块(为了简单我们只考虑类的情况) A 和 B 和 C 它们的依赖关系如下:
1. A 依赖 B 和 C
2. B 依赖 C

那么请问当我们获取 A 模块的时候被依赖两次的 C 是要被实例化几次. 答案是:
1. 默认情况下会创建两次
2. 可以在绑定的时候修改

作用域可以指定三种类型:
```typescript
container.bind(A).toSelf().inSingletonScope()
container.bind(A).toSelf().inTransientScope()
container.bind(A).toSelf().inRequestScope()
```

有什么区别呢:
| 类型 | 表现 |
| ---- | ---- |
| inSingletonScope | 就是单例模式创建一次后就会缓存当其他模块依赖它的时候直接从缓存中读取. 缓存可以手动清除. 一旦指定单例则立即获取缓存 | 
| inTransientScope | 每次获取都要新建实例 |
| inRequestScope | 前两种的结合, 在单次解析中所有的依赖都会被缓存使用, 对于上面的问题在调用 `get(A)` 后 C 模块只会新建一次, 但是再次调用 `get(A)` 时不会从缓存中读取. |

另外不要忘记了可以在创建容器的时候指定容器的默认的作用域策略.

## 解析

用于从容器上来获取绑定的内容, 前面我们已经说过一个 `get` 了还有另外一个 `resolve:
| 名称 | 描述 |
| ---- | ---- |
| get | 从容器上获取给定描述符的模块 |
| resolve | 从容器上获取给定描述符的模块, 如果一个模块没有绑定到容器上也可以解析 |

请看官网例子:
```typescript
@injectable()
class Katana {
    public hit() {
        return "cut!";
    }
}

@injectable()
class Ninja implements Ninja {
    public katana: Katana;
    public constructor(katana: Katana) {
        this.katana = katana;
    }
    public fight() { return this.katana.hit(); }
}

const container = new Container();
container.bind(Katana).toSelf();

const tryGet = () => container.get(Ninja);
expect(tryGet).to.throw("No matching bindings found for serviceIdentifier: Ninja");

const ninja = container.resolve(Ninja);
expect(ninja.fight()).to.eql("cut!");
```

是不是有点神奇 Ninja 没有绑定也可以解析, 主要是注解在编译阶段通过 reflect-metadata 的支持使得 InversifyJS 就已经获取这些类的信息了, 不需要明确的绑定, 是不是有点让人无法接收😂.

# inversify-express-utils

# 231





1. JavaScript 只有一种数据结构那就是 "对象".  
2. 对象是通过构造函数创建的

根据上面的条件构成了一个循环.  
这种循环导致了 JavaScript 原型的复杂性质.  

我们先从一个简单的函数开始, 暂时不要考虑那些麻烦的规则, 然后我们逐渐的增加游戏规则:
```javascript
function B (){

}
```
根据设定函数都存在一个 prototype 属性, 这个属性的值是一个对象, 这个对象上存在一个 `constructor` 属性指向这个函数本身:
```javascript
// 这里 B 函数的赋值只是举例, 函数一旦定义就已经存在这些内容了
B.prototype = {
  constructor:B
}
```
你可以在控制台中自己试一下 `console.dir(B)`.

现在第二个设定来了, 对象是通过 `new` 操作符后跟随一个函数名称来创建的, 用于创建对象的函数被称为构造函数, 这个创建对象的过程被称为实例化:
```javascript
// obj 是对象, 函数 B 是构造函数
const obj = new B;
```

第三个设定, 如果向构造函数的 prototype 属性(是一个对象)添加属性, 那么添加的属性可以被该构造函数创建的实例通过属性访问符获取到.  
比较拗口, 我们向 B 函数的 prototype 添加一些属性:
```javascript
function B (){

}

B.prototype.abc = 123;
```
然后生产一个实例去访问这个属性:
```javascript
const obj = new B;

obj.abc === 123 // true
```
这说明了什么? 说明 B 上的 prototype 属性上的内容可以被它所生产的实例对象引用到, 至少 `obj` 一定和 B 函数的 prototype 存在着某种联系.  

第三个设定, 如果一个对象上不存在一个属性, 则会向上去它的构造函数的 prototype 查找, 如果没有找到则继续向上(之前说过 prototype 也是一个对象)直到彻底找不到为止, 然后抛出该属性不存在的错误, 反之返回这个属性.  
好吧看来确实一个对象是和他的构造函数上的 prototype 存在着关联的, 给定我们一个对象我们如何找到这个对象的构造函数的 prototype 呢?  
在 ES6 之后你可以通过 `Object.getPrototypeOf(obj)` 来获取一个对象的构造函数的 prototype, 在此之前你只能通过不标志的 `obj.__proto__` 来获取:  
```javascript
function B () {

}

const obj = new B

Object.getPrototypeOf(obj) === B.prototype // true
obj.__proto__ === B.prototype // true
```

这些就是你需要知道的有关全部的原型知识了, 其他的内容都是在它的基础上锦上添花.  

不过为了更有趣一点, 我们可以证明一开始的两个规则:
1. JavaScript 只有一种数据结构那就是 "对象".  
2. 对象是通过构造函数创建的

函数是不是对象呢: 
```javascript
function B () {}

B instanceof Object // true
```
通过 instanceof 操作符我们知道了函数是继承自 Object 的, 这说明函数 B 本身就是对象.

不然为什么属性操作符号可以在函数上使用:
```javascript
function B () {}
B.abc = 123

B.abc === 123 // true
```

既然函数是对象, 那么也是被实例化出来的, 构造他的是谁:
```javascript
function B () {

}

B.__proto__ // 指向的是谁的 prototype ?
```

是全局变量 `Function`:
```javascript
B.__proto__ === Function.prototype // true
```
现在你知道了, 用户定义的函数实际上是 JavaScript 引擎通过 `Function` 来创建的, 实际上我们也可以通过 `Function` 来创建一个函数, 但是这里我们不讨论这些.  

但是全局变量 `Function` 也是一个构造函数同时也是一个对象, 这说明它也是被实例化出来的, 他的原型指向的是谁?

```javascript
Function.__proto__ // 指向的是谁的 prototype
```

神奇的是 `Function` 是被自己实例化出来的, 不过这也不难理解, 因为 `Function` 是一个函数而函数都是通过 `Function` 所创建的:
```javascript
Function.__proto__ === Function.prototype // true
```

那好吧 `Function.prototype.__proto__` 指向的是谁, 是全局的 `Object` 构造函数:
```javascript
Function.prototype.__proto__ === Object.prototype // true
```
这是合理的不要忘记了 `prototype` 本身就是一个对象, 所以 `prototype` 这个对象由 `Object` 是通过构造函数实例化出的结果是合理的.  
这也解释了为什么 JavaScript 中任何内容都继承自 Object :
```javascript
function B () {}

Function instanceof Object // true
B instanceof Object // true
Array instanceof Object // true
{} instanceof Object // true
```

那么 `Object.prototype.__proto__` 是谁? 很不幸的是这里就到了 JavaScript 的原型链的终点:
```javascript
Object.prototype.__proto__ === null // true
```
如果你尝试访问某个对象的某个属性, 这个对象并未包含这个属性, 则会沿着对象的原型链进行查找:
```javascript
function B () {}
const obj = new B;

// 尝试访问 obj.abc
obj.abc
// 如果没有则从对象的构造函数原型中查找
B.prototype.abc
// 如果没有则从对象的构造函数原型中查找
Function.prototype.abc
// 如果没有则从对象的构造函数原型中查找
Object.prototype.abc
// 无法继续了因为 Object 没有原型对象了
```

// 原型链查找就可以理解为通过 __proto__ 进行查找, 而所有的内容都是对象, __proto__ 的第一层都是构造函数的 prototype, 而 prototype 的原型就是 Object.prototype 因为 prototype 本身就是对象.  

至于 Function.prototype.__proto__ 为什么指向 Object.prototype 应该是 JavaScript 引擎指定的.


