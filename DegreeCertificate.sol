// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// ═══════════════════════════════════════════════════════════
//  DegreeCertificate.sol
//  Deploy on: Remix IDE → Sepolia Testnet
//  Compiler:  0.8.19 (Enable optimization: 200)
// ═══════════════════════════════════════════════════════════

contract DegreeCertificate {

    // ── Structs ──────────────────────────────────────────────
    struct Certificate {
        address issuer;
        address student;
        string  studentName;
        string  degree;
        string  fieldOfStudy;
        string  university;
        uint256 year;
        string  certHash;       // unique hash generated on frontend
        uint256 timestamp;
        bool    isValid;
    }

    // ── Storage ──────────────────────────────────────────────
    Certificate[]                           private allCerts;
    mapping(address => uint256[])           private studentCertIndexes;
    mapping(string  => uint256)             private hashToIndex;   // certHash → index+1 (0 = not found)
    mapping(address => bool)                public  authorisedIssuers;
    address                                 public  owner;
    uint256                                 public  totalCertificates;

    // ── Events ───────────────────────────────────────────────
    event CertificateIssued(
        address indexed issuer,
        address indexed student,
        string  studentName,
        string  degree,
        string  university,
        uint256 year,
        string  certHash,
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

    // ── Core functions ───────────────────────────────────────

    /// @notice Issue a new degree certificate (only authorised issuers)
    function issueCertificate(
        address _student,
        string  memory _studentName,
        string  memory _degree,
        string  memory _fieldOfStudy,
        string  memory _university,
        uint256        _year,
        string  memory _certHash
    ) external onlyAuthorised {
        require(_student != address(0),         "Invalid student address");
        require(bytes(_studentName).length > 0, "Student name required");
        require(bytes(_degree).length > 0,      "Degree required");
        require(bytes(_certHash).length > 0,    "Certificate hash required");
        require(hashToIndex[_certHash] == 0,    "Certificate hash already exists");
        require(_year >= 1900 && _year <= 2100, "Invalid year");

        Certificate memory cert = Certificate({
            issuer:      msg.sender,
            student:     _student,
            studentName: _studentName,
            degree:      _degree,
            fieldOfStudy:_fieldOfStudy,
            university:  _university,
            year:        _year,
            certHash:    _certHash,
            timestamp:   block.timestamp,
            isValid:     true
        });

        allCerts.push(cert);
        uint256 index = allCerts.length; // index + 1
        studentCertIndexes[_student].push(index - 1);
        hashToIndex[_certHash] = index;
        totalCertificates++;

        emit CertificateIssued(
            msg.sender, _student, _studentName,
            _degree, _university, _year, _certHash, block.timestamp
        );
    }

    /// @notice Verify a certificate by its hash
    function verifyCertificate(string memory _certHash)
        external view returns (bool)
    {
        uint256 idx = hashToIndex[_certHash];
        if (idx == 0) return false;
        return allCerts[idx - 1].isValid;
    }

    /// @notice Get all certificates for a student wallet
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

    /// @notice Get certificate by hash
    function getCertificateByHash(string memory _certHash)
        external view returns (Certificate memory)
    {
        uint256 idx = hashToIndex[_certHash];
        require(idx != 0, "Certificate not found");
        return allCerts[idx - 1];
    }

    /// @notice Get all certificates (public registry)
    function getAllCertificates()
        external view returns (Certificate[] memory)
    {
        return allCerts;
    }
}
