class ImageGenerator {

}

export class StableDiffusionImageGenerator extends ImageGenerator {
  constructor(serverUrl) {
    super();
    this.serverUrl = serverUrl;
    this.generationEndpoint = `${this.serverUrl}/sdapi/v1/txt2img`;
    this.removeBackgroundEndpoint = `${this.serverUrl}/rembg`;
  }

  async generateImage(prompt, removeBackground=false) {
    console.log(`Generating image with prompt: ${prompt}`)
    const header = {
        'Content-Type': 'application/json'
    }

    const body = {
        prompt: prompt,
        batch_size: 1,
        n_iter: 1,
        steps: 20,
        cfg_scale: 7,
        width: 1024,
        height: 1024,
        send_images: true,
    }

    /*
    if (removeBackground) {
        body.script_name = "ABG Remover";
        body.script_args = [
          true,
          true,
          false,
          false,
          false
        ]
    }
    */

    // Generate image
    const response = await fetch(this.generationEndpoint, {
        method: 'POST',
        headers: header,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    let json = await response.json();
    console.dir(json);
    let image = json.images[0];

    if (removeBackground) {
      console.log("Removing background")

      // Remove background
      const response = await fetch(this.removeBackgroundEndpoint, {
          method: 'POST',
          headers: header,
          body: JSON.stringify({
            input_image: json.images[0],
            model: "isnet-general-use",
            return_mask: false,
            alpha_matting: false
          })
      });

      json = await response.json();
      console.dir(json)
      image = json.image;
    }

    return image;
  }
}