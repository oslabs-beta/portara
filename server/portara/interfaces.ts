//Typescript interface

//Interface used to define the type of a user setting when sending the server (portara tool) to server (portara website) mutation to initialize data stored for fields or objects decorated with portara directice
export interface IUserSettings {
  limit?: number | string,
  per?: number | string,
  throttle?: number | string
}

