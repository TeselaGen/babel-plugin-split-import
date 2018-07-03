const template = require("babel-template");

function shouldSplit(state) {
  return (
    state.opts.forceSplit ||
    process.env.FORCE_SPLIT ||
    process.env.NODE_ENV !== "development"
  );
}

const buildSplitImport = template(
  `
    MAKE_LOADABLE(() => import(PATH))
  `,
  {
    plugins: ["dynamicImport"]
  }
);

module.exports = function({ types: t }) {
  const simportName = "simport";
  const setSplitLoaderKey = "setSplitLoader";

  let makeLoadableIdentifier = null;

  return {
    visitor: {
      ExpressionStatement(path) {
        const expression = path.get("expression");
        if (!expression.isCallExpression()) return;

        const callee = expression.get("callee");
        if (!callee.isMemberExpression()) return;

        const object = callee.get("object");
        if (!object.isIdentifier({ name: simportName })) return;
        // If the simport variable is bound, it does not refer to the actual simport operator.
        if (path.scope.hasBinding(simportName)) return;

        const property = callee.get("property");
        if (!property.isIdentifier({ name: setSplitLoaderKey }))
          throw property.buildCodeFrameError(
            `Method ${property.get("name")} not found on ${simportName}.`
          );

        const args = expression.get("arguments");
        if (args.length !== 1)
          callee.buildCodeFrameError(
            `${simportName}.${simportName} must be called with exactly one argument.`
          );

        const arg = args[0];
        makeLoadableIdentifier = path.scope.generateUidIdentifier(
          "makeLoadable"
        );

        // Remove the simport.setSplitLoader(...) expression and replace it with an expression giving
        // us a reference to the make loadable function.
        path.replaceWith(
          t.variableDeclaration("const", [
            t.variableDeclarator(makeLoadableIdentifier, arg.node)
          ])
        );

        // TODO: Maybe see if we are in the top-level scope;
      },
      CallExpression(path, state) {
        // If the simport variable is bound, it does not refer to the actual simport operator.
        if (path.scope.hasBinding(simportName)) return;

        const callee = path.get("callee");
        if (!callee.isIdentifier({ name: simportName })) return;

        const args = path.get("arguments");
        if (args.length !== 1 || !t.isStringLiteral(args[0]))
          callee.buildCodeFrameError(
            `${simportName} must be called with exactly one string literal as its argument.`
          );

        if (!makeLoadableIdentifier)
          callee.buildCodeFrameError(
            `${simportName} is being called before ${simportName}.${setSplitLoaderKey} has been called.`
          );

        if (shouldSplit(state)) {
          path.replaceWith(
            buildSplitImport({
              MAKE_LOADABLE: makeLoadableIdentifier,
              PATH: args[0]
            })
          );
        } else {
          const program = path.findParent(p => p.isProgram());

          const componentIdentifier = program.scope.generateUidIdentifier(
            "Comp"
          );

          program.unshiftContainer(
            "body",
            t.importDeclaration(
              [t.importDefaultSpecifier(componentIdentifier)],
              args[0].node
            )
          );

          path.replaceWith(componentIdentifier);
        }
      }
    }
  };
};
