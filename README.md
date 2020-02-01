# awilix

这个分支主要结合了 `awilix-express` `awilix` `express` `typescript` 等内容.

用于验证 `IoC` 的思想, 或者说 `IoC` 实践.

[awilix](https://www.npmjs.com/package/awilix)本身是一个依赖注入的容器用于 JavaScript/Node, 使用 TypeScript 编写.

而 [awilix-express](https://www.npmjs.com/package/awilix-express)是一个 `awilix` 的工具类, 从名字也可以猜出, 主要是结合了 `express` 主要体现再了和路由的结合上, 并且提供了 `MVC` 结构中的 Model 和 Controller 层.

# 基本概念

## WTF

简单来讲依赖注入的 `awilix` 工作模式就是:
1. 创建一个容器
2. 向容器上注册依赖
3. 业务代码执行的时候需要依赖的内容从容器中获取

所谓的依赖都是可以复用的代码, 可以是任何数据结构/地址引用.

例如这里有一个函数用于从数据库中查找对应用户姓名的相关信息, 毫无疑问一个数据库的驱动, 不会因为一个随时可以调用的函数而实例化两次, 而数据库驱动再一般的应用中都是被单例且被多个模块引用的.  
具有复用的价值, 那么再依赖注入的情况下, 我们的这个完成业务代码的函数如下:
```typescript
async function getUserInfo ({db,userName}){
  return db.find({name:userName})
}
```
你需要注意的是数据库驱动 `db` 以及用户名称 `userName` 是这个函数所正常执行的必要参数, 它们都是通过参数的形式引入的而不是通过引用外部变量的形式.

这意味这什么? 这个函数是独立的, 对外部的依赖为 0, 是一个基本功能单元, 这有什么好处, 我能想到的有如下几点:
1. 好重构, 在最糟的情况下你可以把它的代码复制到任何一个地方, 都不会产生副作用
2. 好修改, 你只需要修改函数内部的内容即可
3. 模块化, 很容易作为一个模块被引用
4. 好测试, 只需要给定输入然后测试输出即可

通过 `awilix` 这个函数执行的时候所依赖的内容(函数/类/数据)会被自动注入, 如果这个函数所依赖的内容不存在 `awilix` 还会进行提示缺失了哪些内容.


## 容器

作为一个依赖注入的实现, 提供了容器的概念(可以理解为一个Map).  
一个容器中可以关联多种依赖(本质上挂载的是函数/类/数据).  

### 创建
```typescript
const container = awilix.createContainer({
  // options
})
```

## 注册

注册 API 有简化版本也有完整版本这里提供一个完整版本:
```typescript
const { asClass, asFunction, asValue } = awilix

const db = new Datebase() // 假设存在 Database 对象

class mailService {

}

/**
 * 这里的函数使用的是闭包的形式.  
 * 最外层的函数接收的是依赖.  
 * 返回的函数可以利用闭包引用 db 又可以通过调用来接收 userName.
 */
function getUserInfo({db}){
  return async function (userName){
    return db.find({name:userName})
  }
}

// register 接收一个对象
// 键名称就是被注册内容的名称
// 对应的值就是注册的内容
// awilix 需要知道这个注册的内容是何种类型
// 是 Class 还是 function 还是 value
// 因为依赖被其他依赖所引用的时候会被解析
// awilix 知道它是何种类型才能正确的解析例如: 传入的是 Class 被引用的时候需要被实例化
// 只有告诉 awilix 传入内容是类, awilix 才能进行实例化
container.register({
  // asClass 告诉 awilix 他是一个类
  mailService: asClass(
    MailService, // 被注册的依赖
    { 
      // 生命周期, 一些列常量由 awilix 提供
      // 用于决定注册的内容作为依赖在被使用的时候
      // 如何进行缓存
      // TRANSIENT 每当被依赖的时候就解析一次
      // SCOPED 在单次执行中, 一个依赖已经被解析过了则复用
      // SINGLETON 在容器中永久缓存(单例)
      // 具体含义查看下一节
      lifetime:Lifetime.SINGLETON
    }
  ),
  // asValue 告诉 awilix 他是一个值(对象)
  db:asValue(db),
  // asFunction 告诉 awilix 他是一个函数
  getUserInfo:asFunction(getUserInfo)
})
```

## 继承与生命周期

容器作为一种载体提供了自我复制或者继承的能力.  

继承能力:
```typescript
const newContainer = createContainer({/** optinos */},parentContainer)
```
此时的 `newContainer` 中可以获取到 `parentContainer` 上注册的内容.

自我复制能力:
```typescript
const scopedContainer = container.createScope(); 
```
`scopedContainer` 是 `container` 的镜像, 注册时如使用了 `scoped` :
```typescript
container.register({
  ScopedService: asClass(ScopedService).scoped(), // 这里使用了
  SingletonService:asClass(SingletonService).singleton()
})
```
执行如下代码:
```typescript
const scopedContainer = container.createScope();

scopedContainer.resolve('ScopedService')
scopedContainer.resolve('SingletonService')

container.resolve('ScopedService')
container.resolve('SingletonService')
```
输出的内容:
```
ScopedService created!
SingletonService created
ScopedService created!
```

这说明使用了 `scoped` 选项的依赖一旦在容器中解析就会被缓存解析结果, 而单例则无论是否在镜像容器中均为解析完成后缓存.

## 解析

试想一个容器上已经注册了多个模块, 现在我们要执行其中一个.  
```typescript
container.resolve('getUserInfo'); // getUserInfo 就是我们通过 container.register 注册的模块名称.
```

那么所谓的依赖注入的实现 `awilix` 为我们做了什么了呢.  
当我们告诉容器解析 `getUserInfo` 模块的时候, 实际上要的是解析的结果.  

容器会解析 `getUserInfo` 去发现它需要什么依赖, 然后再去解析依赖, 当然依然的内容也是注册的模块也遵循上面的工作模式.  

当依赖完全解析后会将依赖注入, 如果我们解析的模块是一个类, 他会将依赖实例化的过程中通过构造函数将依赖进行注入. 如果解析的是函数则会调用函数并传入依赖的内容. 然后返回它们执行的结果.  

这也是为什么对于函数模块使用闭包的原因, 第一层的函数是专门用于接收依赖的, 返回的函数才是真正的函数模块, 可以接收外部传入的变量:
```typescript
container.register({
  test:asFunction(function test(db){
    return async function (userName){
      return db.find({user:userName})
    }
  })
})

// 完成依赖的注入
const test = container.resolve('test');
// 外部传入变量
const userInfo = await test('Mr hello');
```

另外 `awilix.container` 还提供了一个代理属性:
```typescript
const resolved = container.cradle.xxxx
```

通过 `cradle.xxxx` 可以获取对应名称注册的模块而不必使用 `container.resolve('xxxx')` 来获取解析的内容.  

## 自动加载

手动注册模块在工程化的项目中显然是不现实的, 无论如何你都会简化这一步骤.  

`awilix` 直接提供了这个能力, 允许你从某个本地的目录中加载这些模块, 或者说自动注册这些模块.  

这就需要一个模块单独的存放到一个文件中, 通过默认导出 `awilix` 就可以自动加载它们, 理想的状态下就是建立一个目录, 然后将有关的模块放入其中然后自动加载, 文件的名称就是模块的名称, 所以建议文件名称是驼峰格式.  
当然也存在多个模块存放到一个文件中的情况, 但是这里不讨论这种情况.  

加载的 API 是 `container.loadModules` 该方法第一个参数是数组提供有关模块的信息, 第二个参数是一个对象提供加载的一些选项.  
```typescript
// Load our modules!
container.loadModules([
  // Globs!
  [
    // 通过嵌套数组的格式我们可以为一组 Globs 添加更加明确的解析选项
    'models/**/*.js',
    {
      register: awilix.asValue,
      lifetime: Lifetime.SINGLETON
    }
  ],
  // 这些 Globs 就会使用默认的选项解析
  // 当然你可以在模块中指定解析选项, 但是这些内容不在我们的讨论范围内
  'services/**/*.js',
  'repositories/**/*.js'
],
// 第二个参数指示如何解析
  {
    // 模块格式化方式
    formatName: 'camelCase',
    // 对于这次解析的解析选项
    resolverOptions: {
      lifetime: Lifetime.SINGLETON,
      // 告诉 awilix 这些注册的模块是 Class 还是 function 还是 value, 否则 awilix 就会进行自动猜测
      register: awilix.asClass
    }
  }
)
```

# awilix-express

`awilix-express` 实际上就是一个工具类的集合, 利用它可以简单的将 `express` 和 `awilix` 进行结合.

如何结合呢? `awilix-express` 提供了控制器(controller), 没错就是 MVC 中的 C 层. 

对于很多专职的后端人员对于控制器概念相比是熟记于心了, 但是对于我这个连基本概念都不了解的人来说, 这才刚刚开始.    

这里还是扯几句, 对于 MVC 结构来讲, 各层主要负责各自的功能.
- model 数据层 基本上就是一些类, 每一个类上存在一些方法, 这些方法去操作数据库. 每一个类都是一个独立的单元, 而这个单元提供不同的方法操作哪些针对这个单元所管辖的数据. 从抽象角度来看, 有关数据的操作都被封装到了一系列类中, 其他位置获取数据就可以不操作数据库来获取数据, 降低了数据库与其他模块的耦合.  
- view 视图层, 非常简单就是将给定的数据映射到对应的字符串给定的占位符上, 然后完成一系列字符串拼接后返回拼接的结果.  
- controller model 只关心数据, view 只关心视图, 但是一次完整的请求基本都是读取/修改数据后填入到 view 层中然后将 view 数据返回. 所以 controller 就是 model 和 view 之间的胶水, 也是一次请求进入到服务器代码中的第一道关卡.

`typescript` 提供了装饰器语法的支持, 对于前端来说这样的写法可能有些诡异, 但是这里没有什么魔法, 它们非常简单, 下面给出了一个 controller 的写法:
```typescript
import bodyParser from 'body-parser'
import { authenticate } from './your-auth-middleware'
import { route, GET, POST, before } from 'awilix-express' // or `awilix-router-core`
 
@route('/users')
export default class UserAPI {
  constructor({ userService }) {
    this.userService = userService
  }
 
  @route('/:id')
  @GET()
  @before([authenticate()])
  async getUser(req, res) {
    res.send(await this.userService.get(req.params.id))
  }
 
  @POST()
  @before([bodyParser()])
  async createUser(req, res) {
    res.send(await this.userService.create(req.body))
  }
}
```

要了解这段代码做了什么, 首先要知道这个类也是一个要被 `awilix` 加载的模块, 所以在构造函数中它依赖了一个 userService.  

而所提供的两个方法 `getUser` 和 `createUser` 的格式基本就是 `express` 上的中间件语法. 这意味着你可以在这里获取用户传递的信息然后处理信息然后响应一些数据.  

你可以看到上上述的两个方法中使用了注入的 `userService` 然后利用 `userService` 操作数据后响应给用户. 没错这里的 `userService` 实际上就是 model, 只不过这里并未出现 view 而已.  

接下来看有关装饰器语法的部分, `@route('/users')` 表示该类所匹配的路由地址, 而 `getUser` 的 `@route('/:id')` 则进一步的限制了该方法被生效的范围.  

而 `@GET()` 与 `@POST()` 则表示该方法匹配的 http method 也就是说, `GET /users/123` 会调用 `getUser` 方法而 `POST /uesrs/123` 不会, `POST /users` 会调用 `createUser` 方法.  

`@before([bodyParser()])` 允许你在执行这个方法之前执行一些给定的中间件.

## 加载控制器

在我们了解完成控制器的基本概念后, 现在我们来看看如何使用控制器:
```typescript
import Express from 'express'
import { loadControllers } from 'awilix-express'
 
const app = Express()

app.use(loadControllers('routes/*.js', { cwd: __dirname }))
 
app.listen(3000)
```
我想你也猜到了 `loadControllers` 调用后会返回一个函数而他的作用利用本次请求的地址去匹配对于地址的控制器, 而控制器本质上就是一个模块, 在路由可以完全匹配到控制器上的方法后, `awilix` 会去解析依赖注入然后调用对应的方法.  

控制器中的依赖怎么办如何注入, 不用担心问题已经解决, 通过 `awilix-express` 模块:
```typescript
import Express from 'express'
import { asClass, createContainer } from 'awilix'
import { loadControllers, scopePerRequest } from 'awilix-express'
 
const app = Express()
const container = createContainer().loadModules([/** 依赖的模块 */])

// scopePerRequest 会为每次请求创建这个容器的拷贝, 确保每一次请求都由独立的上下文(允许缓存的除外)
app.use(scopePerRequest(container))

app.use(loadControllers('routes/*.js', { cwd: __dirname }))
 
app.listen(3000)
```