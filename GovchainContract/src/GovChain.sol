// src/GovChain.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

contract GovChain is ERC1155, AccessManaged, ERC1155Supply {
    struct Document {
        string ipfsHash;
        address owner;
        address pendingOwner;
        bool ownerApproved;
        bool govtApproved;
    }
    
    mapping(uint256 => Document) public documents;
    uint256 private _nextTokenId = 1;
    address public govtAddress;
    
    event DocumentCreated(uint256 indexed tokenId, string ipfsHash, address owner);
    event TransferRequested(uint256 indexed tokenId, address indexed from, address indexed to);
    event OwnerApproved(uint256 indexed tokenId, address indexed owner);
    event GovtApproved(uint256 indexed tokenId, address indexed govt);
    event TransferCompleted(uint256 indexed tokenId, address indexed from, address indexed to);
    
    constructor(address initialAuthority, address _govtAddress)
        ERC1155("")
        AccessManaged(initialAuthority)
    {
        govtAddress = _govtAddress;
    }
    
    function uploadDocument(string memory ipfsHash) public returns (uint256) {
        uint256 newTokenId = _nextTokenId++;
        
        documents[newTokenId] = Document({
            ipfsHash: ipfsHash,
            owner: msg.sender,
            pendingOwner: address(0),
            ownerApproved: false,
            govtApproved: false
        });
        
        _mint(msg.sender, newTokenId, 1, "");
        
        emit DocumentCreated(newTokenId, ipfsHash, msg.sender);
        return newTokenId;
    }
    
    function requestTransfer(uint256 tokenId, address newOwner) public {
        require(documents[tokenId].owner == msg.sender, "Not the owner");
        require(documents[tokenId].pendingOwner == address(0), "Transfer already pending");
        
        documents[tokenId].pendingOwner = newOwner;
        documents[tokenId].ownerApproved = false;
        documents[tokenId].govtApproved = false;
        
        emit TransferRequested(tokenId, msg.sender, newOwner);
    }
    
    function approveTransferAsOwner(uint256 tokenId) public {
        require(documents[tokenId].owner == msg.sender, "Not the owner");
        require(documents[tokenId].pendingOwner != address(0), "No pending transfer");
        
        documents[tokenId].ownerApproved = true;
        emit OwnerApproved(tokenId, msg.sender);
        
        _checkAndCompleteTransfer(tokenId);
    }
    
    function approveTransferAsGovt(uint256 tokenId) public {
        require(msg.sender == govtAddress, "Only government can approve");
        require(documents[tokenId].pendingOwner != address(0), "No pending transfer");
        
        documents[tokenId].govtApproved = true;
        emit GovtApproved(tokenId, msg.sender);
        
        _checkAndCompleteTransfer(tokenId);
    }
    
    function _checkAndCompleteTransfer(uint256 tokenId) private {
        Document storage doc = documents[tokenId];
        if (doc.ownerApproved && doc.govtApproved) {
            address from = doc.owner;
            address to = doc.pendingOwner;
            
            // Update document ownership
            doc.owner = to;
            doc.pendingOwner = address(0);
            doc.ownerApproved = false;
            doc.govtApproved = false;
            
            // Transfer the token
            _safeTransferFrom(from, to, tokenId, 1, "");
            
            emit TransferCompleted(tokenId, from, to);
        }
    }
    
    function getDocument(uint256 tokenId) public view returns (
        string memory ipfsHash,
        address owner,
        address pendingOwner,
        bool ownerApproved,
        bool govtApproved
    ) {
        Document memory doc = documents[tokenId];
        return (
            doc.ipfsHash,
            doc.owner,
            doc.pendingOwner,
            doc.ownerApproved,
            doc.govtApproved
        );
    }

    // Override required by Solidity
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Supply)
    {
        super._update(from, to, ids, values);
    }
}