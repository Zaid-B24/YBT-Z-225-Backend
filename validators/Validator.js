// const validate = (schema) => (req, res, next) => {
//   console.log("--- Data Received by Server ---");
//   console.log(req.body); // This will show you exactly what the server sees
//   console.log("-------------------------------");
//   try {
//     req.body = schema.parse(req.body);
//     next();
//   } catch (error) {
//     console.error("--- ZOD VALIDATION ERROR ---", error);
//     return res.status(400).json({ errors: error.errors });
//   }
// };

// module.exports = validate;

const validate = (schema) => async (req, res, next) => {
  console.log("--- Data Received by Server ---");
  console.log(req.body);
  console.log("-------------------------------");
  try {
    // Zod's parse will throw an error if validation fails
    const parsed = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
      files: req.files, // Include files for potential validation
    });

    // Replace request parts with validated and coerced data
    req.body = parsed.body;
    req.query = parsed.query;
    req.params = parsed.params;
    req.files = parsed.files;

    return next();
  } catch (error) {
    console.error("--- ZOD VALIDATION ERROR ---", error);
    return res.status(400).json({ errors: error.issues });
  }
};

module.exports = validate;
