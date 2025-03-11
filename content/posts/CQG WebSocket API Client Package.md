---
title: CQG WebSocket API Client Package
date: 2025-03-11
draft: false
tags:
  - tech
---
# CQG WebSocket API Client Package (`client`)

This document provides a comprehensive guide to the `client` package, designed for interacting with the CQG WebSocket API. It encompasses WebSocket connection management, message serialization/deserialization, and methods for various API operations such as logon, logoff, symbol resolution, market data subscription, and historical data retrieval.

## Table of Contents

1.  [Overview](#overview)
2.  [Installation](#installation)
3.  [Usage](#usage)
4.  [CQGClient Type](#cqgclient-type)
5.  [Functions](#functions)
    *   [NewCQGClient Function](#newcqgclient-function)
    *   [Logon Function](#logon-function)
    *   [Logoff Function](#logoff-function)
    *   [ResolveSymbol Function](#resolvesymbol-function)
    *   [ResolveAccount Function](#resolveaccount-function)
    *   [SubscribeMarketData Function](#subscribemarketdata-function)
    *   [RequestBarTime Function](#requestbartime-function)
    *   [HandleMessages Function](#handlemessages-function)
    *   [PrettyPrintProto Function](#prettyprintproto-function)
    *   [Close Function](#close-function)
6.  [Data Flow](#data-flow)
7.  [Error Handling](#error-handling)
8.  [Environment Variables](#environment-variables)
9.  [Dependencies](#dependencies)
10. [Example Code](#example-code)

## Overview

The `client` package provides a robust and convenient way to interact with the CQG WebSocket API.  It encapsulates the complexities of WebSocket communication, Protocol Buffer (protobuf) serialization, and API authentication.  It offers a set of high-level functions to perform common tasks such as retrieving market data and historical information. This client is designed to work seamlessly with other parts of your application, especially the handler functions detailed in separate documentation.

## Installation

Ensure that all required dependencies are also installed using:

```bash
go mod tidy
```

## Usage

The `client` package is typically used in conjunction with the Fiber framework to create API endpoints that provide access to CQG data.  See the examples in the handlers' documentation for concrete usage.

A typical workflow involves:
1.  Creating a `CQGClient` instance using `NewCQGClient`.
2.  Logging on to the CQG API using `Logon`.
3.  Performing desired API operations like `ResolveSymbol`, `SubscribeMarketData`, or `RequestBarTime`.
4.  Handling incoming messages from the CQG API using `HandleMessages`.
5.  Closing the connection using `Close` when the client is no longer needed.

## CQGClient Type  

```go
type CQGClient struct {
    WS               *websocket.Conn
    BaseTime         int64
    ContractMetadata *pb.ContractMetadata
}
```
  
`CQGClient` represents a client for interacting with the CQG WebSocket API.  It holds the WebSocket connection, base time (used for calculations), and contract metadata.

*   `WS`: WebSocket connection instance (`*websocket.Conn` from `github.com/gofiber/websocket/v2`).  This is the underlying WebSocket connection used for communication.

*   `BaseTime`: Base timestamp provided by the server (int64), used for time calculations and synchronization with the CQG API.

*   `ContractMetadata`:  A pointer to `pb.ContractMetadata` (from `go-websocket/proto/WebAPI`).  This holds metadata for the resolved contract, such as price scaling information.
## Functions
### NewCQGClient Function
```go
func NewCQGClient() (*CQGClient, error)
```


`NewCQGClient` creates a new `CQGClient` instance and establishes a WebSocket connection to the CQG API endpoint. The API endpoint is defined by environment variables (see [Environment Variables](#environment-variables)).

  

**Returns:**

  

*   `*CQGClient`: A pointer to the newly created `CQGClient` instance if successful.

*   `error`: An error if any issue occurred during client creation or connection establishment. This could include network errors, invalid URLs, or problems with the WebSocket handshake.

  

**Example:**

  

```go
cqgClient, err := NewCQGClient()
if err != nil {
    log.Fatalf("Failed to create CQG client: %v", err)
}
defer cqgClient.Close() // Ensure the connection is closed when done
```

  

### Logon Function

  

```go
func (c *CQGClient) Logon(userName string, password string, clientAppId string, clientVersion string, protocolVersionMajor uint32, protocolVersionMinor uint32) error
```

  

`Logon` authenticates the client with the CQG API using the provided credentials. This function sends a logon request to the CQG API and waits for a response to confirm successful authentication.

  

**Parameters:**

  

*   `userName`: The username for authentication (string). This corresponds to your CQG API account username.

*   `password`: The password for authentication (string). This corresponds to your CQG API account password.

*   `clientAppId`: The client application ID (string). This is an identifier for your application provided by CQG.

*   `clientVersion`: The client application version (string). This is the version number of your client application.

*   `protocolVersionMajor`: The major version of the protocol (uint32). This must match the protocol version supported by the CQG API.

*   `protocolVersionMinor`: The minor version of the protocol (uint32). This must also match the protocol version supported by the CQG API.

  

**Returns:**

  

*   `error`: An error if any issue occurred during the logon process. This can include:

    *   Missing credentials.

    *   Serialization errors (if the logon message cannot be properly encoded).

    *   WebSocket write/read errors (if there are network issues).

    *   Server rejection (if the credentials are invalid or the API is unavailable).

    *   Invalid base time format (if the server returns an unexpected time format).

  

**Example:**

  

```go
err := cqgClient.Logon(os.Getenv("USERNAME"), os.Getenv("PASSWORD"), os.Getenv("CLIENT_APP_ID"), os.Getenv("CLIENT_VERSION"), protocolMajor, protocolMinor)
if err != nil {
    log.Fatalf("Logon failed: %v", err)
}
```

  

### Logoff Function

  

```go
func (c *CQGClient) Logoff() error
```

  

`Logoff` sends a logoff message to the CQG API, terminating the session gracefully.  It's important to call this function when you're done using the client to release resources on the server side.

  

**Returns:**

  

*   `error`: An error if any issue occurred during the logoff process.  This could include serialization errors or WebSocket write/read errors.

  

**Example:**

  

```go
err := cqgClient.Logoff()
if err != nil {
    log.Printf("Logoff failed: %v", err)
}
```

  

### ResolveSymbol Function

  

```go
func (c *CQGClient) ResolveSymbol(symbolName string, msgID uint32, subscribe bool) (uint32, error)
```

  

`ResolveSymbol` resolves a symbol name to a contract ID using the CQG API. This is a crucial step before subscribing to market data or requesting historical data.  It also populates the `ContractMetadata` field of the `CQGClient` with information about the contract.

  

**Parameters:**

  

*   `symbolName`: The symbol name to resolve (string) (e.g., "NQZ2").

*   `msgID`: A unique message ID for the request (uint32).  This is used to correlate requests and responses.

*   `subscribe`: A boolean indicating whether to subscribe to market data for the symbol after resolution.  Note: this does *not* actually subscribe to the data; it only sets a flag within the request.

  

**Returns:**

  

*   `uint32`: The contract ID if the symbol is successfully resolved.  This is the ID used in subsequent API calls.

*   `error`: An error if any issue occurred during the symbol resolution process. This could include:

    *   An empty symbol name.

    *   Serialization errors.

    *   WebSocket write/read errors.

    *   Failure to find contract metadata in the response (meaning the symbol couldn't be resolved).

  

**Example:**

  

```go
contractID, err := cqgClient.ResolveSymbol("NQZ2", 1, true)
if err != nil {
    log.Fatalf("Symbol resolution failed: %v", err)
}
fmt.Printf("Resolved contract ID: %d\n", contractID)
```

  

### ResolveAccount Function

  

```go
func (c *CQGClient) ResolveAccount(msgID uint32) (interface{}, error)
```

  

`ResolveAccount` retrieves account information from the CQG API.

  

**Parameters:**

  

*   `msgID`: A unique message ID for the request (uint32).

  

**Returns:**

  

*   `interface{}`: The raw server message containing account information.  This is a protobuf message, typically `*pb.ServerMsg`.

*   `error`: An error if any issue occurred during the account resolution process.  This could include serialization errors or WebSocket write/read errors.

  

**Example:**

  

```go
accountInfo, err := cqgClient.ResolveAccount(1)
if err != nil {
    log.Fatalf("Failed to resolve account: %v", err)
} 
serverMsg, ok := accountInfo.(*pb.ServerMsg)
if !ok {
    log.Fatalf("Unexpected response type: %T", accountInfo)
}
//  Process the ServerMsg to extract the needed data.
```

  

### SubscribeMarketData Function

  

```go
func (c *CQGClient) SubscribeMarketData(contractID uint32, msgID uint32, level uint32) error
```

  

`SubscribeMarketData` subscribes to market data for a specific contract ID at a given level.  After calling this function, the `HandleMessages` function will start receiving market data updates for the subscribed contract.

  

**Parameters:**

  

*   `contractID`: The ID of the contract to subscribe to (uint32).  This is the ID obtained from `ResolveSymbol`.

*   `msgID`: A unique message ID for the request (uint32).

*   `level`: The level of market data to subscribe to (uint32).  Common values include:

    *   `0`: Best bid and ask.

    *   `1`: Level 1 data.

    *   Higher levels may be supported depending on your CQG API subscription.  Consult the CQG API documentation for details.

  

**Returns:**

  

*   `error`: An error if any issue occurred during the subscription process. This could include:

    *   An invalid contract ID.

    *   Serialization errors.

    *   WebSocket write errors.

    *   Insufficient permissions (if your account doesn't have access to the requested data).

  

**Example:**

  

```go
err := cqgClient.SubscribeMarketData(contractID, 2, 0)
if err != nil {
    log.Fatalf("Market data subscription failed: %v", err)
}
```

  

### RequestBarTime Function

  

```go
func (c *CQGClient) RequestBarTime(msgID uint32, contractID uint32, barUnit uint32, timeRange models.TimeRange, requestType uint32) error
```

  

`RequestBarTime` requests historical time bar data from the CQG API. This function allows you to retrieve historical price and volume data for a given contract over a specified time range.

  

**Parameters:**

  

*   `msgID`: A unique message ID for the request (uint32).

*   `contractID`: The ID of the contract to request data for (uint32).

*   `barUnit`: The time unit for the bars (uint32). Use constants from the `models` package:

    *   `models.DailyIndex`: Daily bars.

    *   `models.HourlyIndex`: Hourly bars.

    *   `models.MinutelyIndex`: Minutely bars.

*   `timeRange`: The time range for the data request (`models.TimeRange`).  This struct specifies the period and the number of periods to retrieve.  See the `models` package documentation for details.

*   `requestType`: The type of request (uint32).  This is typically set to `1` for a standard historical data request.  Consult the CQG API documentation for other options.

  

**Returns:**

  

*   `error`: An error if any issue occurred during the data request process. This could include:

    *   An invalid contract ID.

    *   An invalid time range.

    *   Serialization errors.

    *   WebSocket write errors.

    *   Data unavailable for the requested symbol or time range.

  

**Example:**

  

```go
timeRange := models.TimeRange{Period: "day", Number: 10}
err := cqgClient.RequestBarTime(3, contractID, models.DailyIndex, timeRange, 1)
if err != nil {
    log.Fatalf("Historical data request failed: %v", err)
}
```

  

### HandleMessages Function

  

```go
func (c *CQGClient) HandleMessages(handler func(*pb.ServerMsg))
```

  

`HandleMessages` continuously reads messages from the WebSocket connection and passes them to a handler function for processing. This function is the core of receiving real-time updates and responses from the CQG API. It runs in a separate goroutine to avoid blocking the main thread.

  

**Parameters:**

  

*   `handler`: A function that takes a pointer to a `*pb.ServerMsg` (from `go-websocket/proto/WebAPI`) and processes it. The handler function is responsible for:

    *   Inspecting the `ServerMsg` to determine its type.

    *   Extracting the relevant data from the message.

    *   Performing any necessary actions based on the data (e.g., updating a UI, storing data in a database, etc.).

    If `handler` is `nil`, it will only log the error and return. This is not recommended for production code, as it will drop all incoming messages.

  

**Example:**

  

```go
go cqgClient.HandleMessages(func(serverMsg *pb.ServerMsg) {
    if rtData := serverMsg.GetRealTimeMarketData(); rtData != nil {
        // Process real-time market data
        fmt.Printf("Received Realtime Market Data: %v\n", rtData)
    } else if timeBarReports := serverMsg.GetTimeBarReports(); len(timeBarReports) > 0 {
        //Process time bar data
        fmt.Printf("Received Time Bar Report: %v\n", timeBarReports)
    } else {
        // Handle other message types
        fmt.Printf("Received other server message: %v\n", serverMsg)
    }
})
```

  

**Important Notes:**

  

*   This function runs in a separate goroutine, so it does not block the main thread.

*   The handler function should be designed to be thread-safe, as it will be called concurrently by the `HandleMessages` goroutine.

*   It is crucial to handle all possible message types in the handler function to ensure that your application responds correctly to all events from the CQG API.

*  Implement error handling in your handler function

  

### PrettyPrintProto Function

  

```go
func PrettyPrintProto(msg proto.Message) string
```

  

`PrettyPrintProto` formats a protobuf message into a human-readable string, useful for debugging and logging.

  

**Parameters:**

  

*   `msg`: The protobuf message to format (`proto.Message` from `google.golang.org/protobuf/proto`).

  

**Returns:**

  

*   `string`: A string representation of the protobuf message.

  

**Example:**

  

```go
log.Printf("Received message:\n%s", PrettyPrintProto(serverMsg))
```

  

### Close Function

  

```go
func (c *CQGClient) Close()
```

  

`Close` closes the WebSocket connection. This should be called when the client is no longer needed to release resources. It's crucial to call this function to avoid resource leaks and ensure proper connection termination.

  

**Example:**

  

```go
cqgClient.Close()
```

  

## Data Flow

  

A typical interaction with the CQG API using this client follows this flow:

  

6.  **Establish Connection:** Create a `CQGClient` using `NewCQGClient()`.

7.  **Authenticate:** Log on to the CQG API using `Logon()`.

8.  **Resolve Symbol:** Resolve the desired symbol to its contract ID using `ResolveSymbol()`.

9.  **Subscribe to Market Data (Optional):** Subscribe to market data for the resolved contract using `SubscribeMarketData()`.

10.  **Request Historical Data (Optional):** Request historical data using `RequestBarTime()`.

11.  **Process Messages:** Start the message handling loop by calling `HandleMessages()` in a separate goroutine. This function continuously reads messages from the WebSocket connection and passes them to a handler function for processing.  The handler function is responsible for extracting data from the messages and performing the necessary actions.

12.  **Clean Up:** When finished, call `Close()` to close the WebSocket connection and release resources.

  

## Error Handling

  

The `client` package provides comprehensive error handling. Each function returns an `error` value to indicate whether the operation was successful. You should always check the `error` value and handle it appropriately. Common error scenarios include:

  

*   **Network Errors:** Problems with the WebSocket connection (e.g., connection refused, connection timeout, broken pipe).

*   **Authentication Failures:** Invalid username or password.

*   **Serialization Errors:** Problems encoding or decoding protobuf messages.

*   **API Errors:** Errors returned by the CQG API (e.g., invalid symbol, insufficient permissions).

  

Always log errors and take appropriate actions, such as retrying the operation or displaying an error message to the user.

  

## Environment Variables

  

The `client` package relies on the following environment variables for configuration:

  

*   `USERNAME`: The username for your CQG API account.

*   `PASSWORD`: The password for your CQG API account.

*   `CLIENT_APP_ID`: The client application ID provided by CQG.

*   `CLIENT_VERSION`: The version of your client application.

*   `PROTOCOL_VERSION_MAJOR`: The major version of the CQG API protocol.

*   `PROTOCOL_VERSION_MINOR`: The minor version of the CQG API protocol.

*   `CQG_API_URL`:  [Optional - if not set, defaults to the hardcoded URL in client.go] The URL of the CQG WebSocket API endpoint.

  

These environment variables should be set before running your application.  It is recommended to use a `.env` file and the `godotenv` package to manage these variables.

  

## Dependencies

  

The `client` package has the following dependencies:

  

*   `github.com/gofiber/websocket/v2`: For WebSocket communication.

*   `google.golang.org/protobuf/proto`: For working with Protocol Buffers (protobuf).

*   `google.golang.org/protobuf/encoding/protojson`: For converting between protobuf messages and JSON.

*   `log`: For logging messages.

*   `os`: For accessing environment variables.

*   `strconv`: For converting strings to numbers.

*   `fmt`: For formatted output.

*   `go-websocket/proto/WebAPI`: The generated Go code from the CQG API's Protocol Buffer definitions (defining the structure of messages).

  

## Example Code

  

```go
package main

import (
    "fmt"
    "go-websocket/internal/client"
    "go-websocket/internal/models"
    "log"
    "os"
    "strconv"
    "google.golang.org/protobuf/proto"
)

func main() {
    // Load environment variables (if not already loaded)
    // ...
    // Create a new CQG client
    cqgClient, err := client.NewCQGClient()
    if err != nil {
        log.Fatalf("Failed to create CQG client: %v", err)
        return
    }
    defer cqgClient.Close()

    // Retrieve login credentials and protocol version from environment variables
    userName := os.Getenv("USERNAME")
    password := os.Getenv("PASSWORD")
    clientAppId := os.Getenv("CLIENT_APP_ID")
    clientVersion := os.Getenv("CLIENT_VERSION")
    protocolVersionMajor := os.Getenv("PROTOCOL_VERSION_MAJOR")
    protocolVersionMinor := os.Getenv("PROTOCOL_VERSION_MINOR")
    protocolMajor, err := strconv.ParseUint(protocolVersionMajor, 10, 32)

    if err != nil {
        fmt.Errorf("invalid PROTOCOL_VERSION_MAJOR: %v", err)
    }
    protocolMinor, err := strconv.ParseUint(protocolVersionMinor, 10, 32)
    if err != nil {
        fmt.Errorf("invalid PROTOCOL_VERSION_MINOR: %v", err)
    }

    // Log on to the CQG API
    err = cqgClient.Logon(userName, password, clientAppId, clientVersion, uint32(protocolMajor), uint32(protocolMinor))
    if err != nil {
        log.Fatalf("Logon failed: %v", err)
        return
    }

    // Resolve a symbol
    symbolName := "NQZ2"
    msgID := uint32(1)
    contractID, err := cqgClient.ResolveSymbol(symbolName, msgID, false)
    if err != nil {
        log.Fatalf("Symbol resolution failed: %v", err)
        return
    }

    // Subscribe to market data (optional)
    err = cqgClient.SubscribeMarketData(contractID, 2, 0)
    if err != nil {
        log.Fatalf("Market data subscription failed: %v", err)
        return
    }

    // Request historical data (optional)
    timeRange := models.TimeRange{Period: "day", Number: 10}
    err = cqgClient.RequestBarTime(3, contractID, models.DailyIndex, timeRange, 1)
    if err != nil {
        log.Fatalf("Historical data request failed: %v", err)
        return
    }

    // Handle incoming messages in a separate goroutine
    go cqgClient.HandleMessages(func(serverMsg *pb.ServerMsg) {
        log.Printf("Received message:\n%s", client.PrettyPrintProto(serverMsg))
        //  Add data processing logic here.
    })

    // Keep the application running to receive messages
    select {} // Block indefinitely to keep the main goroutine alive.
}
```