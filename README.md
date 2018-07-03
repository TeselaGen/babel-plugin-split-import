# babel-plugin-split-import

## Why?

When adding code splitting to our app we ran into the problem where recompile time while working in development was too slow. We found that the code splitting using dynamic imports was slowing it down. This plugin's goal is to transform imports to use code-splitting only in production so dev times are still fast.


## Usage

### Configuration
By default, `babel-plugin-split-import` won't use code-splitting. Code splitting can be enabled through the `FORCE_SPLIT` command line variable or the `forceSplit` babel plugin option.

If you are using eslint, you will likely want to add `simport` as a global variable.

### In JavaScript Code
The first step is to set the function that returns a component given a loader via the `simport.setSplitLoader` function. This should be called before `simport` is used anywhere. Afterwards, call `simport` with the path to the imported component.

#### Example
```js
import Loadable from "react-loadable";

function makeLoadableComponent(loader) {
  return Loadable({
    loader
  });
}

simport.setSplitLoader(makeLoadableComponent);

const MyComponent = simport("./path/to/MyComponent");
```

If the plugin is configured to use code splitting, then the code will compile to:
```js
import MyComponent from "./path/to/MyComponent"
```
Otherwise, the code will compile to:
```js
const MyComponent = makeLoadableComponent(() => import("./path/to/MyComponent"));
```
