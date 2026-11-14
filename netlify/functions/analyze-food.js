exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const { image } = JSON.parse(event.body || "{}");

    if (!image || !image.startsWith("data:image/")) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "الصورة غير صالحة" })
      };
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
          input: [{
            role: "user",
            content: [
              {
                type: "input_text",
                text: "حلل الطعام الظاهر بالصورة. أعطني تقديراً تقريبياً للسعرات والبروتين والكربوهيدرات والدهون بالغرام. لا تخمّن الوزن بدقة إذا لم يكن واضحاً. أجب بصيغة JSON فقط بالمفاتيح: name, calories, protein, carbs, fat, assumptions."
              },
              {
                type: "input_image",
                image_url: image
              }
            ]
          }],
          text: {
            format: { type: "json_object" }
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Analysis failed");
    }

    const output = data.output
      ?.flatMap(item => item.content || [])
      .find(item => item.type === "output_text")?.text;

    if (!output) {
      throw new Error("No analysis returned");
    }

    const result = JSON.parse(output);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "تعذر تحليل الطعام، حاول مرة أخرى"
      })
    };
  }
};