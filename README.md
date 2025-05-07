# Thnk – lightweight prompt manager

Thnk is a command-line tool and JS library that automates the process of generating files/content with LLMs, similar to how Make automates the building of software. It uses a configuration file, akin to a Makefile, to manage dependencies and determine the operations required to generate target files from source files.

Thnk can be used both as a command-line tool and programmatically via its JavaScript API. This enables a seamless workflow where you can iterate on your prompts and configurations independently, then use them directly in your application with all your settings preserved.

**Breaking change in v2**: Thnk no longer uses a Makefile-like syntax, but instead YAML, which makes the file format much more flexible.

### Creating AI generation pipelines

Thnk allows you to create pipelines from subsequent prompts and generations, ensuring that only the necessary files are regenerated. This means that if a dependency changes, Thnk will determine which target files need to be updated, saving time and costs.

Supports OpenAI models' prediction feature, which speeds up re-generation of files with minor changes.

### Version controlling prompts and outputs

Thnk also helps in version controlling of AI prompts with git, allowing you to track changes in your prompt files over time. By committing your prompts and the generated outputs, you can see how modifications to the prompts influence the generated text, aid collaboration and improve reproducibility.

## Installation

To install Thnk, you need Node.js. Once Node.js is installed, you can install Thnk using npm:

```bash
npm install -g thnk
```

Ensure that you have set the `OPENAI_API_KEY` environment variable to use the OpenAI models:

```bash
export OPENAI_API_KEY='your_openai_api_key_here'
```

## Usage

To use Thnk, you need to create a `Thnkfile.yml` in your project directory. This file defines the targets, dependencies, and the AI model configurations needed to generate your files.

Run Thnk in your terminal:

```bash
thnk
```

Thnk will read the `Thnkfile.yml`, check for changes in dependencies, and regenerate the target files if necessary.

### Command-line Options

Thnk supports the following command-line options:

- `-B, --always-thnk`: Always regenerate files, even if dependencies haven't changed.
- `-i, --interactive`: Run in interactive mode (see Interactive Mode section below).

```bash
# Always regenerate files
thnk -B
```

## Thnkfile.yml Syntax

A `Thnkfile.yml` uses YAML format to define targets, dependencies, and recipes. Here's a brief overview of its syntax:

- **Targets and Dependencies**: Each target is defined under the `targets` key with its dependencies listed under `needs`.

  ```yaml
  targets:
    output.txt:
      needs:
        - dependency1.txt
        - dependency2.txt
  ```

- **Prompts**: The prompt can be specified directly in the Thnkfile.yml using the `prompt` key, or you can reference an external prompt file using the YAML tag syntax `!file`:

  ```yaml
  targets:
    hello.txt:
      needs:
        - user.json
      prompt: |
        Greet the user
  ```

  ```yaml
  targets:
    hello.txt:
      needs:
        - user.json
      prompt: !file greeting.prompt.md
  ```

- **Templates**:
  You can also use Handlebars templates for dynamic prompts with the `!handlebars` YAML tag. In these, you can access variables from the `data` key, both global and per target.

  ```yaml
  data:
    style: formal
  targets:
    hello.txt:
      needs:
        - users.json
      data:
        name: 'John Doe'
      prompt: !handlebars |
        Greet the user named {{name}} in {{style}} style
  ```

- **Generation settings**: You can specify global settings that apply to all targets at the top level, or override them per target:

  ```yaml
  model: gpt-4o
  temperature: 0.7

  targets:
    output.txt:
      model: claude-3.7-sonnet
      temperature: 0.2

      needs:
        - dependency1.txt
  ```

- **Schema files**: For `.json` targets, you can specify a schema file using the YAML tag syntax `!file`:

  ```yaml
  targets:
    output.json:
      needs:
        - data.txt
      prompt: |
        Generate a JSON file from data.txt
      schema: !file my.schema.json
  ```

See the `examples` folder for sample `Thnkfile.yml` configurations.

## Generation settings

Here are the configuration options that can be used globally or per target:

| Option        | Description                   | Default       |
| ------------- | ----------------------------- | ------------- |
| `prompt`      | The prompt to use             | empty string  |
| `schema`      | The JSON schema to use        | no schema     |
| `model`       | The LLM model to use          | `gpt-4o-mini` |
| `temperature` | Controls randomness (0.0-2.0) | `0.0`         |

## Interactive Mode

Interactive mode allows you to repeatedly regenerate files without having to restart the command. This is particularly useful during development when iterating on prompts or templates.

```bash
# Run in interactive mode
thnk -i
```

In interactive mode:

- Thnk will run once initially
- Press Enter to re-run the thnking
- Press Ctrl+C to exit

## Programmatic API

Thnk can be used programmatically in your JavaScript/Node.js applications. This allows you to use prompts and configurations defined in Thnkfile.yml from within your code. In this case, we are no longer talking about _files_ per se, but in-memory entities whose generation logic is described in your Thnkfile.yml.

The main idea is that you can freely iterate on your prompts and configurations without your host application running. Then you can seamlessly use your prompts in your application with all the settings and pre-processigns you defined in your Thnkfile.yml.

**_Work in progress!_** Currently pipelines (consecutive generations that depend on each other) are not supported in the programmatic API.

### Installation

For programmatic usage, install Thnk as a dependency in your project:

```bash
npm install thnk
```

### Basic Usage

```yaml
# Thnkfile.yml
targets:
  greeting:
    temperature: 0.7
    prompt: !handlebars |
      Write a friendly greeting to the person, according to the time of day.
      The time is {{time}}.
      The person's name is {{name}}.
  dataSheet.json:
    prompt: !handlebars |
      Make a data sheet in JSON for the following product:
      {{product}}
    schema: !file dataSheet.schema.json
```

```javascript
import { Thnk } from 'thnk'

// Initialize Thnk with the path to your Thnkfile.yml (defaults to './Thnkfile.yml')
const THNK = new Thnk('./Thnkfile.yml')

// Generate text content
const greeting = await THNK.text('greeting', {
  data: {
    name: 'Jacob',
    time: '9:30PM',
  },
})
console.log(greeting)

// Generate JSON content
const dataSheet = await THNK.object('dataSheet.json', {
  data: {
    product: {
      product_name: 'Wakewake X123xi laptop 275G 512SSD i7',
      stock: 7,
    },
  },
})
console.log(dataSheet)
```

### API Reference

#### `new Thnk(thnkfileName)`

Creates a new Thnk instance.

- `thnkfileName` (string): Path to your Thnkfile.yml (defaults to 'Thnkfile.yml')

#### `async text(target, options)`

Generates text content for the specified target.

- `target` (string): The target name as defined in your Thnkfile.yml
- `options` (object): Optional configuration
  - `data`: Object containing data to be used in templates

Returns a Promise that resolves to the generated text content.

#### `async object(target, options)`

Generates JSON content for the specified target and parses it into a JavaScript object.

- `target` (string): The target name as defined in your Thnkfile.yml (must be a JSON target, so it must end with `.json` and the rule must have a schema)
- `options` (object): Optional configuration
  - `data`: Object containing data to be used in templates

Returns a Promise that resolves to the parsed JavaScript object.
