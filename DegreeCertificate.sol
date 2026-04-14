// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// ═══════════════════════════════════════════════════════════
//  DegreeCertificate.sol  v2.0 (FIXED)
//  Deploy on: Remix IDE → Sepolia Testnet
//  Compiler:  0.8.19 (Enable optimization: 200)
// ═══════════════════════════════════════════════════════════

contract DegreeCertificate {

    // ── Structs ──────────────────────────────────────────────
    struct Certificate {
        address issuer;
        address student;
        string  enrolmentNumber;   
        string  studentName;
        string  degree;
        string  fieldOfStudy;
        string  university;
        uint256 year;
        string  certHash;          // Kept as string to match frontend '0x...' format
        string  certId;            
        uint256 timestamp;
        bool    isValid;
    }

    // ── Storage ──────────────────────────────────────────────
    Certificate[]                           private allCerts;
    mapping(address  => uint256[])          private studentCertIndexes;
    mapping(string   => uint256)            private hashToIndex;        
    mapping(string   => uint256)            private enrolToIndex;       
    mapping(address  => bool)               public  authorisedIssuers;
    address                                 public  owner;
    uint256                                 public  totalCertificates;

    // ── Events ───────────────────────────────────────────────
    event CertificateIssued(
        address indexed issuer,
        address indexed student,
        string  enrolmentNumber,
        string  studentName,
        string  degree,
        string  university,
        uint256 year,
        string  certHash,
        string  certId,
        uint256 timestamp
    );
    event IssuerAuthorised(address indexed issuer);
    event IssuerRevoked(address indexed issuer);

    // ── Modifiers ────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    modifier onlyAuthorised() {
        require(
            msg.sender == owner || authorisedIssuers[msg.sender],
            "Not an authorised issuer"
        );
        _;
    }

    // ── Constructor ──────────────────────────────────────────
    constructor() {
        owner = msg.sender;
        authorisedIssuers[msg.sender] = true;
    }

    // ── Admin functions ──────────────────────────────────────
    function authoriseIssuer(address _issuer) external onlyOwner {
        authorisedIssuers[_issuer] = true;
        emit IssuerAuthorised(_issuer);
    }

    function revokeIssuer(address _issuer) external onlyOwner {
        authorisedIssuers[_issuer] = false;
        emit IssuerRevoked(_issuer);
    }

    // ── Core: single issue ───────────────────────────────────
    function issueCertificate(
        address _student,
        string  memory _enrolmentNumber,
        string  memory _studentName,
        string  memory _degree,
        string  memory _fieldOfStudy,
        string  memory _university,
        uint256        _year,
        string  memory _certHash,
        string  memory _certId
    ) external onlyAuthorised {
        require(_student != address(0),              "Invalid student address");
        require(bytes(_studentName).length > 0,      "Student name required");
        require(bytes(_enrolmentNumber).length > 0,  "Enrolment number required");
        require(bytes(_degree).length > 0,           "Degree required");
        require(bytes(_certHash).length > 0,         "Certificate hash required");
        require(hashToIndex[_certHash] == 0,         "Hash already exists");
        require(enrolToIndex[_enrolmentNumber] == 0, "Enrolment already issued");
        require(_year >= 1900 && _year <= 2100,      "Invalid year");

        _storeCert(
            _student, _enrolmentNumber, _studentName,
            _degree, _fieldOfStudy, _university,
            _year, _certHash, _certId
        );
    }

    // ── Core: batch issue (Excel upload) ─────────────────────
    function batchIssueCertificates(
        address[] memory _students,
        string[]  memory _enrolments,
        string[]  memory _names,
        string[]  memory _degrees,
        string[]  memory _fields,
        string[]  memory _universities,
        uint256[] memory _years,
        string[]  memory _certHashes,
        string[]  memory _certIds
    ) external onlyAuthorised {
        require(
            _students.length == _enrolments.length &&
            _enrolments.length == _names.length &&
            _names.length == _degrees.length &&
            _degrees.length == _certHashes.length,
            "Array length mismatch"
        );
        for (uint256 i = 0; i < _students.length; i++) {
            if (hashToIndex[_certHashes[i]] != 0) continue;
            if (enrolToIndex[_enrolments[i]] != 0) continue;
            if (_students[i] == address(0)) continue;

            _storeCert(
                _students[i], _enrolments[i], _names[i],
                _degrees[i], _fields[i], _universities[i],
                _years[i], _certHashes[i], _certIds[i]
            );
        }
    }

    function _storeCert(
        address _student,
        string memory _enrolmentNumber,
        string memory _studentName,
        string memory _degree,
        string memory _fieldOfStudy,
        string memory _university,
        uint256 _year,
        string memory _certHash,
        string memory _certId
    ) internal {
        Certificate memory cert = Certificate({
            issuer:          msg.sender,
            student:         _student,
            enrolmentNumber: _enrolmentNumber,
            studentName:     _studentName,
            degree:          _degree,
            fieldOfStudy:    _fieldOfStudy,
            university:      _university,
            year:            _year,
            certHash:        _certHash,
            certId:          _certId,
            timestamp:       block.timestamp,
            isValid:         true
        });

        allCerts.push(cert);
        uint256 index = allCerts.length;            
        studentCertIndexes[_student].push(index - 1);
        hashToIndex[_certHash]          = index;
        enrolToIndex[_enrolmentNumber]  = index;
        totalCertificates++;

        emit CertificateIssued(
            msg.sender, _student, _enrolmentNumber, _studentName,
            _degree, _university, _year, _certHash, _certId, block.timestamp
        );
    }

    // ── Verify by hash ────────────────────────────────────────
    function verifyCertificate(string memory _certHash)
        external view returns (bool)
    {
        uint256 idx = hashToIndex[_certHash];
        if (idx == 0) return false;
        return allCerts[idx - 1].isValid;
    }

    // ── FIXED: Compare hashes using keccak256 encoding ────────
    function verifyCertificateHash(string memory _enrolment, string memory _hashToCheck)
        external view returns (bool authentic, bool exists)
    {
        uint256 idx = enrolToIndex[_enrolment];
        if (idx == 0) return (false, false);
        Certificate memory cert = allCerts[idx - 1];
        
        // Since both cert.certHash and _hashToCheck are passed as strings like "0xabc...", 
        // we can directly compare their string values via keccak256
        bool isMatch = keccak256(abi.encodePacked(cert.certHash)) == keccak256(abi.encodePacked(_hashToCheck));
        
        return (isMatch && cert.isValid, true);
    }

    // ── Lookup by enrolment (Student Panel) ──────────────────
    function getCertificateByEnrolment(string memory _enrolment)
        external view returns (Certificate memory)
    {
        uint256 idx = enrolToIndex[_enrolment];
        require(idx != 0, "Certificate not found");
        return allCerts[idx - 1];
    }

    function getCertificatesByStudent(address _student)
        external view returns (Certificate[] memory)
    {
        uint256[] memory indexes = studentCertIndexes[_student];
        Certificate[] memory result = new Certificate[](indexes.length);
        for (uint256 i = 0; i < indexes.length; i++) {
            result[i] = allCerts[indexes[i]];
        }
        return result;
    }

    function getCertificateByHash(string memory _certHash)
        external view returns (Certificate memory){
        uint256 idx = hashToIndex[_certHash];
        require(idx != 0, "Certificate not found");
        return allCerts[idx - 1];
    }

    function getAllCertificates()
        external view returns (Certificate[] memory)
    {
        return allCerts;
    }

    function getAllCertificatesPaginated(uint256 _from, uint256 _count)
        external view returns (Certificate[] memory)
    {
        require(_from < allCerts.length, "Out of range");
        uint256 end = _from + _count;
        if (end > allCerts.length) end = allCerts.length;
        Certificate[] memory result = new Certificate[](end - _from);
        for (uint256 i = _from; i < end; i++) {
            result[i - _from] = allCerts[i];
        }
        return result;
    }
}