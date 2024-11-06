// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test} from "forge-std/Test.sol";
import "../src/GovChain.sol";

contract GovChainTest is Test {
    GovChain public govChain;
    address public owner;
    address public govtAddress;
    address public user1;
    address public user2;
    
    function setUp() public {
        owner = address(this);
        govtAddress = makeAddr("government");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        govChain = new GovChain(owner, govtAddress);
        
        // Fund test accounts
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
    }

    function test_PropertyRegistration() public {
        vm.startPrank(user1);
        
        uint256 tokenId = govChain.registerProperty(
            "residential",
            "123 Main St",
            2000,
            500000,
            "2BHK Apartment"
        );
        
        (
            string memory propertyType,
            string memory location,
            uint256 area,
            uint256 value,
            string memory description,
            address propertyOwner,
            ,,  // Skip pendingOwner, ownerApproved, govtApproved
        ) = govChain.getProperty(tokenId);
        
        assertEq(propertyType, "residential");
        assertEq(location, "123 Main St");
        assertEq(area, 2000);
        assertEq(value, 500000);
        assertEq(description, "2BHK Apartment");
        assertEq(propertyOwner, user1);
        assertEq(govChain.balanceOf(user1, tokenId), 1);
        
        vm.stopPrank();
    }

    function test_TransferRequest() public {
        // First register a property
        vm.startPrank(user1);
        uint256 tokenId = govChain.registerProperty(
            "residential",
            "123 Main St",
            2000,
            500000,
            "2BHK Apartment"
        );
        
        // Request transfer to user2
        govChain.requestTransfer(tokenId, user2);
        
        (,,,,,, address pendingOwner,,) = govChain.getProperty(tokenId);
        assertEq(pendingOwner, user2);
        
        vm.stopPrank();
    }

    function test_TransferApprovalFlow() public {
        // Register property
        vm.prank(user1);
        uint256 tokenId = govChain.registerProperty(
            "residential",
            "123 Main St",
            2000,
            500000,
            "2BHK Apartment"
        );
        
        // Request transfer
        vm.prank(user1);
        govChain.requestTransfer(tokenId, user2);
        
        // Owner approves
        vm.prank(user1);
        govChain.approveTransferAsOwner(tokenId);
        
        // Government approves
        vm.prank(govtAddress);
        govChain.approveTransferAsGovt(tokenId);
        
        // Check final ownership
        (,,,,, address newOwner,,,) = govChain.getProperty(tokenId);
        assertEq(newOwner, user2);
        assertEq(govChain.balanceOf(user2, tokenId), 1);
        assertEq(govChain.balanceOf(user1, tokenId), 0);
    }

    function testFail_UnauthorizedTransferRequest() public {
        // Register property as user1
        vm.prank(user1);
        uint256 tokenId = govChain.registerProperty(
            "residential",
            "123 Main St",
            2000,
            500000,
            "2BHK Apartment"
        );
        
        // Try to request transfer as user2 (should fail)
        vm.prank(user2);
        govChain.requestTransfer(tokenId, user2);
    }

    function testFail_UnauthorizedGovtApproval() public {
        // Register property
        vm.prank(user1);
        uint256 tokenId = govChain.registerProperty(
            "residential",
            "123 Main St",
            2000,
            500000,
            "2BHK Apartment"
        );
        
        // Request transfer
        vm.prank(user1);
        govChain.requestTransfer(tokenId, user2);
        
        // Try to approve as non-government address (should fail)
        vm.prank(user2);
        govChain.approveTransferAsGovt(tokenId);
    }

    function test_MultipleProperties() public {
        vm.startPrank(user1);
        
        uint256 tokenId1 = govChain.registerProperty(
            "residential",
            "123 Main St",
            2000,
            500000,
            "2BHK Apartment"
        );
        
        uint256 tokenId2 = govChain.registerProperty(
            "commercial",
            "456 Business Ave",
            5000,
            1000000,
            "Office Space"
        );
        
        assertEq(govChain.balanceOf(user1, tokenId1), 1);
        assertEq(govChain.balanceOf(user1, tokenId2), 1);
        
        vm.stopPrank();
    }

    function testFail_DoubleTransferRequest() public {
        // Register property
        vm.prank(user1);
        uint256 tokenId = govChain.registerProperty(
            "residential",
            "123 Main St",
            2000,
            500000,
            "2BHK Apartment"
        );
        
        vm.startPrank(user1);
        // First transfer request
        govChain.requestTransfer(tokenId, user2);
        
        // Second transfer request should fail
        govChain.requestTransfer(tokenId, makeAddr("user3"));
        vm.stopPrank();
    }

    receive() external payable {}
}