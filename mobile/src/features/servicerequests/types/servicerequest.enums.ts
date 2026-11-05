//servicerequest.enums.ts
// Backend ile birebir: backend API sözleşmesi (service-requests)

export enum RequestStatus {
  New = 1,
  Assigned = 2,
  InProgress = 3,
  OnHold = 4,
  Completed = 5,
  Cancelled = 6,
}

export enum RequestPriority {
  Low = 1,
  Normal = 2,
  High = 3,
  Critical = 4,
}

export enum RequestSource {
  Web = 1,
  WhatsApp = 2,
  WhatsAppAi = 3,
  Email = 4,
  Phone = 5,
}

// NOT: LocationSource burada tanımlanmaz — workorder.enums.ts'te zaten var, oradan import edilir.
