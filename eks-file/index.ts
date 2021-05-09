import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

// Create a VPC for our cluster.
const vpc = new awsx.ec2.Vpc("newvpc", {
    cidrBlock: "10.0.0.0/16",
    numberOfAvailabilityZones: 2,
   // subnets: [
     // { type: "public" },
     // { type: "private" }],
 });
//var pubIp = vpc.privateSubnetIds;
////var privateIp = vpc.publicSubnetIds;
//var vpc_id = vpc.id+'';
//const allVpcSubnets = aws.ec2.getSubnetIds({
  //  vpcId: vpc_id,
//});

// Create an EKS cluster inside of the VPC.
const cluster = new eks.Cluster("my-cluster", {
    vpcId: vpc.id,
    subnetIds: vpc.publicSubnetIds,
    nodeAssociatePublicIpAddress: false,
});

// Export the cluster's kubeconfig.
//export const kubeconfig = cluster.kubeconfig;

const appName = "my-app";
const appLabels = { appClass: appName };
const deployment = new k8s.apps.v1.Deployment(`${appName}-dep`, {
    metadata: { labels: appLabels },
    spec: {
        replicas: 2,
        selector: { matchLabels: appLabels },
        template: {
            metadata: { labels: appLabels },
            spec: {
                containers: [{
                    name: appName,
                    image: "nginx",
                    ports: [{ name: "http", containerPort: 80 }]
                }],
            }
        }
    },
}, { provider: cluster.provider });

 const service = new k8s.core.v1.Service(`${appName}-svc`, {
   metadata: { labels: appLabels },
    spec: {
        type: "LoadBalancer",
       ports: [{ port: 80, targetPort: "http" }],
         selector: appLabels,
    },
 }, { provider: cluster.provider });

// Export the URL for the load balanced service.
//export const url = service.status.loadBalancer.ingress[0].hostname;


// Export the cluster's kubeconfig.
//export const kubeconfig = cluster.kubeconfig;
