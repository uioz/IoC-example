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
  )
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

这说明使用了 `scoped` 选项的依赖在容器本体或者作用域容器中解析的内容会被缓存, 而单例则无论是否在镜像中一律缓存.


