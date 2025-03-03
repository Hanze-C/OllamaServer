# Ollama Server

[中文](./README_zh-CN.md)

## Introduction
**Ollama Server** is a project that can start Ollama service with one click on Android devices. Without relying on Termux, it allows users to easily infer language models on Android devices.

The Ollama service started by **Ollama Server** is no different from that started by other methods. You can choose any client that calls Ollama to interact with the API provided by Ollama service.

## Features
- **One-click deployment**: Easily start and manage the Ollama service.
- **No Termux required**: Works independently without additional terminal emulation.

## Current supported capabilities
- One click start of Ollama service
- One click pull to retrieve the official model provided by Ollama
- Upload custom .gguf models
- Delete existing model
- Close the running model

## Screenshots
<div style="display: flex; flex-wrap: wrap; gap: 10px;">
  <img src="./screenshot/1.png" style="width: 30%">
  <img src="./screenshot/2.png" style="width: 30%"> 
  <img src="./screenshot/3.png" style="width: 30%">
</div>

## Installation
1. Download the latest release from [GitHub Releases](https://github.com/sunshine0523/OllamaServer/releases).
2. Install the APK on your Android device.
3. Open the app and start the Ollama service with one click.

## Acknowledgements
We would like to express our gratitude to the following projects:
- **[Ollama](https://github.com/ollama/ollama)**: Without Ollama, this project would not exist.
- **[ChatterUI](https://github.com/chatterui/chatterui)**: Reference for Markdown plugin configuration.
- **[Iconfont](https://www.iconfont.cn/)**: Providing icons for the interface.

## License
This project is open-source and licensed under the GPL-3 License.
