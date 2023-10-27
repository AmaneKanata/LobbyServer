var express = require('express');
var router = express.Router();

const axios = require("axios");
const fs = require("fs");

const kubeAddress = "https://agones-dns-8r8rb6bk.hcp.koreacentral.azmk8s.io";
//const token = "wck52cmcm2sn7iqed9cv2irxdql3bzusbahzbwpeg1nqiwhb9tingqva0egm53ojd2jxrs8o14rjcxaeii0od7w16kd0qvvr8gyo0tw6zs09sat80356n9zdsxzotcr9";
const token = fs.readFileSync("/var/run/secrets/kubernetes.io/serviceaccount/token", "utf8");
const ca = fs.readFileSync("/var/run/secrets/kubernetes.io/serviceaccount/ca.crt");
const namespace = "default";

const config = {
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  httpsAgent: new (require('https').Agent)({
    ca: ca
  })
};

const gameServerAllocationAddress = `${kubeAddress}/apis/allocation.agones.dev/v1/namespaces/${namespace}/gameserverallocations`

const gameServerAllocationBody = 
{
  "apiVersion": "allocation.agones.dev/v1",
  "kind": "GameServerAllocation",
  "spec": {
    "selectors": [
      {
        "gameServerState" : "Allocated"
      },
      {
        "gameServerState" : "Ready"
      },
    ],
    "scheduling": "Packed",
    "metadata": {
      "labels" : {}
    }
  }
}

function MakeGameServerAllocationBody(mode)
{
  const ret = {...gameServerAllocationBody};
  ret["spec"]["selectors"][0]["matchLabels"]["MODE"] = mode;
  ret["spec"]["metadata"]["labels"]["MODE"] = mode;
  return ret;
}

router.get('/Room/:mode', function(req, res, next) {

  console.log("Get Room : ", req.params.mode);

  //gameServerAllocationBody["spec"]["selectors"][0]["matchLabels"]["MODE"] = req.params.mode;
  gameServerAllocationBody["spec"]["selectors"][0]["matchLabels"] = {
    "MODE": req.params.mode
  };
  gameServerAllocationBody["spec"]["metadata"]["labels"]["MODE"] = req.params.mode;

  console.log("gameServerAllocationBody: ");
  console.dir(gameServerAllocationBody);

  axios.post(gameServerAllocationAddress, gameServerAllocationBody, config)

  .then((response) => {
    //console.log('Resource created:', response);
    res.send(response.data);
  })
  .catch((error) => {
    console.error('Error creating resource:', error);
    res.send(error);
  });
});

module.exports = router;
