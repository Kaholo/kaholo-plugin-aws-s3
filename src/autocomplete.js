async function listRegions(query, pluginSettings) {
    let options = [
      {
        "id":"us-east-1",
        "value":"US East (N. Virginia)"
      },
      {
        "id":"us-east-2",
        "value":"US East (Ohio)"
      },
      {
        "id":"us-west-1",
        "value":"US West (N. California)"
      },
      {
        "id":"us-west-2",
        "value":"US West (Oregon)"
      },
      {
        "id":"ap-east1",
        "value":"Asia Pacific (Hong Kong)"
      },
      {
        "id":"ap-south1",
        "value":"Asia Pacific (Mumbai)"
      },
      {
        "id":"ap-southeast-1",
        "value":"Asia Pacific (Singapore)"
      },
      {
        "id":"ap-southeast-2",
        "value":"Asia Pacific (Sydney)"
      },
      {
        "id":"ap-northeast-1",
        "value":"Asia Pacific (Tokyo)"
      },
      {
        "id":"ap-northeast-2",
        "value":"Asia Pacific (Seoul)"
      },
      {
        "id":"sa-east-1",
        "value":"South America (São Paulo)"
      },
      {
        "id":"eu-central-1",
        "value":"EU (Frankfurt)"
      },
      {
        "id":"eu-west-1",
        "value":"EU (Ireland)"
      },
      {
        "id":"eu-west-2",
        "value":"EU (London)"
      },
      {
        "id":"eu-west-3",
        "value":"EU (Paris)"
      },
      {
        "id":"eu-north-3",
        "value":"EU (Stockholm)"
      },
      {
        "id":"eu-south-1",
        "value":"EU (Milan)"
      },
      {
        "id":"ca-central-1",
        "value":"Canada (Central)"
      },
      {
        "id":"me-south-1",
        "value":"Middle East (Baharain)"
      },
      {
        "id":"af-south-1",
        "value":"Africa (Cape Town)"
      }
    ]
    //let options = response.items.map((item) => ({ id: item.id, value: item.name}));
    if (!query) {
        return options;
    }
    const filteredList = options.filter(val => val.value.includes(query))
    return filteredList;
}


module.exports = {
    listRegions
}