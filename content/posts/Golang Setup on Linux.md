---
title: blogtitle
date: 2025-03-12
draft: false
tags:
  - Golang
  - Setup
---
# Golang Setup on Linux

## Step 1: Download Golang
Download the latest Go binary from the official website:
```sh
https://go.dev/dl/
```

For example, to download Go 1.24.1:
```sh
wget https://go.dev/dl/go1.24.1.linux-amd64.tar.gz
```

## Step 2: Remove Existing Go Installation (If Any)
If you have an older version of Go installed, remove it before proceeding:
```sh
sudo rm -rf /usr/local/go
```

## Step 3: Extract and Install Go
Extract the downloaded archive to `/usr/local/`:
```sh
sudo tar -C /usr/local -xzf go1.24.1.linux-amd64.tar.gz
```
**Note:** Do not extract into an existing `/usr/local/go` directory as it may cause installation issues.

## Step 4: Set Up Environment Variables
To use Go globally, add it to your PATH by modifying the profile file.

For user-specific installation, update `~/.bashrc`:
```sh
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc

source ~/.bashrc
```

## Step 5: Verify Installation
Run the following command to check the installed version of Go:

```sh
go version
```
Expected output (example):
```sh
go version go1.24.1 linux/amd64
```
