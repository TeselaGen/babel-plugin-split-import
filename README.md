# babel-plugin-split-import

## Why?

When adding code splitting to our app we ran into the problem where recompile time while working in development was too slow. We found that the code splitting using dynamic imports was slowing it down. This plugin's goal is to transform imports to use code-splitting only in production so dev times are still fast.
