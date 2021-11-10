# mydid-auth

## Usage

Install package :

```shell
npm i @xsl-labs/mydid-auth
```

&nbsp;
Import package :

```javascript
const mydidAuth = require("@xsl-labs/mydid-auth");
```

&nbsp;
**Initialize with provider and smart contract address :**

_initialize: (config: object)_

```javascript
try {
  mydidAuth.initialize({
    web3GivenProvider: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    smartContractAddress: "0x6828adf1aED03be429eE42053a4F72CDd3c70846",
  });
} catch (err) {
  // Handle error
  console.log("Error trying to initialize mydid-auth : " + err);
}
```

> If module is not initialized, will used default value :
>
> - web3GivenProvider: 'https://data-seed-prebsc-1-s1.binance.org:8545/'
> - smartContractAddress: '0x6828adf1aED03be429eE42053a4F72CDd3c70846'

&nbsp;
**Create verifiable presentation request :**

_createVPRequest: (challenge: string, domain: string, verifiableCredentials: string[])_

```javascript
const VPRequest = mydidAuth.createVPRequest(
  // Custom string for identifying challenge in database
  "6360c6acfe7951946f0532dcee1d314645312a4b5480d80646ff9241ce68892d",
  // Callback where will be sent verifiable presentation
  "https://mywebsite.com/api/v1/callback",
  // Verifiable credentials asked for authentication
  ["email", "nationality"]
);
```

> If not verifiable credentials are needed, set verifiableCredentials to an empty array.

&nbsp;
**Validate consistency of verifiable presentation :**

_validateVPConsistency: (VPData: object)_

```javascript
try {
  mydidAuth.validateVPConsistency(verifiablePresentation);
} catch (err) {
  // Handle error
  console.log('Can't valid verifiable presentation consistency : ' + err);
}
```

&nbsp;
**Validate authenticity of verifiable presentation :**

_validateVPAuthenticity: async (VPData: object)_

```javascript
try {
  await mydidAuth.validateVPAuthenticity(verifiablePresentation);
} catch (err) {
  // Handle error
  console.log('Can't valid verifiable presentation authenticity : ' + err);
}
```
