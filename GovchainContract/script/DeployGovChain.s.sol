// script/DeployGovChain.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/GovChain.sol";

contract DeployGovChain is Script {
    function run() external {
        // Using the first address from anvil as authority and second as govt address
        address authority = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;  // First anvil address
        address govtAddress = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8; // Second anvil address

        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80; // First anvil private key
        
        vm.startBroadcast(deployerPrivateKey);
        
        GovChain govChain = new GovChain(authority, govtAddress);
        console.log("GovChain deployed to:", address(govChain));
        
        vm.stopBroadcast();
    }
}