## Nesoi Examples: Simple Project

This folder contains an example on how to create a very simple _Nesoi_ project.

The required folder structure is:
```
    - nesoi.ts
    - modules/
        - {}/
            ...
    - apps/
        {}.app.ts
```

The `nesoi.ts` file declares a `Space` for your project.

The `apps/{}.apps.ts` file declares a `MonolythApp` for this project.

### Running

This project contains a `main.ts` file, which acts as the entry point for the application.

You can run it directly using `tsx`:

```
cd examples/2_simple_project
npx tsx bin/main.ts
```

### Compiling Types

The file `nesoi.ts` contains an import from the `.nesoi` folder, which is created by the Nesoi compiler.

This folder contains the pre-computed types of all elements, which makes the type resolving consistent, inspectable and performant.

In order to compile, you can use the script from the nesoi tools folder:

```
npx tsx ../../tools/compile.ts
```

It should create a `.output` if it doesn't exists, and update it's contents with the built schemas and their types.

Everytime you create or modify an element, you should re-run this tool to update how other elements see it.

### Compiling the Monolyth

Once your application is done, you can compile a NPM package from it, which can either be run through the exposed `bin` files, or imported as a library.

A script to control this compile process is present at `bin/compile.ts`.

In order to compile the monolyth, simply run this script:

```
npx tsx bin/compile.ts
```

The resulting package will be output to `build/{SPACE_NAME}`.

#### Running the compiled Monolyth

Before running, you must install the dependencies:

```
cd build/Simple
npm i
```

Then, you can run any on the exposed bin files through `npm`:

```
npm run main
```