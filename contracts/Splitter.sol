pragma solidity ^0.4.4;
contract Splitter{
    address public owner;
    event logBalance(uint balance1, uint balance2, uint balance3);

    function Splitter(){
        owner = msg.sender;
    }
    
    function splitBalance(address receiver1, address receiver2)
        public
        payable
        returns (bool success)
    {
        address contributor = msg.sender;
        uint amount = msg.value;
        if(amount == 0) throw;
        uint half = amount / 2;
        uint remainder = amount - half * 2;
        
        receiver1.transfer(half);
        receiver2.transfer(half);
        if(remainder > 0) contributor.transfer(remainder);
        logBalance(contributor.balance, receiver1.balance, receiver2.balance);
        return true;
    }
    
    function kill()
        public 
        returns(bool success){
        if(msg.sender != owner) throw;
        selfdestruct(owner);
        return true;
    }    
}