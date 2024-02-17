class ImageGenerator {

}

export class StableDiffusionImageGenerator extends ImageGenerator {
  constructor(serverUrl = 'http://localhost:7860') {
    super();
    this.serverUrl = serverUrl;
    this.generationEndpoint = `${this.serverUrl}/sdapi/v1/txt2img`;
  }

  async generateImage(prompt) {
    const header = {
        'Content-Type': 'application/json'
    }

    const body = {
        prompt: prompt,
        batch_size: 1,
        n_iter: 1,
        steps: 1,
        cfg_scale: 1,
        width: 512,
        height: 512,
        send_images: true
    }

    // Generate image
    const response = await fetch(this.generationEndpoint, {
        method: 'POST',
        headers: header,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    return json.images[0];
  }
}