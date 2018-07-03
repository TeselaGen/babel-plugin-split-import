module.exports = `

import makeLoadableComponent from "./utils/makeLoadableComponent";

simport.setSplitLoader(makeLoadableComponent)

export const privateRoutes = {
  "/": simport("./components/WelcomePage")
}
`;
